export const UNSUPERVISED_MODULES = [
  {
    id: 'clustering_overview',
    title: 'Clustering Taxonomy',
    subtitle: 'Partitional vs hierarchical vs density-based, no ground truth = no accuracy',
    difficulty: 'foundational',
    estimatedMin: 38,
    tags: ['clustering', 'taxonomy', 'unsupervised'],
    summary: `You have 10 million user sessions on an e-commerce site. You want to segment users into behavioral types to personalize recommendations. Nobody labeled anything — no one told you "this is a bargain hunter, this is a researcher, this is an impulse buyer." You need to find structure in the data itself. This is unsupervised learning: discovering pattern without a target variable.

The hard part is not the algorithm — it is that without labels, you cannot measure "correct." Every clustering algorithm embeds an assumption about what good clusters look like. K-means assumes spherical clusters of equal size. DBSCAN assumes density-separated clusters. Hierarchical methods assume nested structure. Choosing the algorithm is choosing an assumption, and the right assumption depends on your data geometry. Apply the wrong one and you get confident, stable, wrong clusters.

Evaluation without labels uses three internal metrics. Silhouette score: (b - a) / max(a, b) where a = mean distance to same-cluster points, b = mean distance to nearest different-cluster points. Range [-1, 1], higher is better — but biased toward spherical clusters. Davies-Bouldin index: ratio of within-cluster scatter to between-cluster distance, lower is better. Calinski-Harabasz index: ratio of between-cluster to within-cluster dispersion, higher is better. None of these is a substitute for domain evaluation. A silhouette score of 0.7 on clusters that mix bargain hunters with power users is useless.

Two other failure modes compound as the data or K get large. The curse of dimensionality: as feature count grows, distances between points become statistically similar — with 512 features, the gap between the nearest and farthest neighbor distance shrinks, so "nearest centroid" becomes a nearly arbitrary label. Init sensitivity: K-means starts from randomly placed centroids and only guarantees convergence to a local optimum, not the global one — different random initializations can land on different final clusters, and with a large K (say 150) relative to a modest sample size (10,000 points, about 67 points per cluster on average), those clusters are small enough that which points land where becomes unstable from run to run.

The metric that matters is business validity: pull 20 random examples from each cluster and ask "does this make sense?" Can your recommendation team write a distinct strategy for each segment? If not, the clustering has not solved the problem regardless of what any internal metric says.

[FIGURE: cluster_shapes]

NOT-this: "Clustering finds the true segments in your data." Clustering finds segments consistent with the algorithm's assumptions. The "true segments" only exist if your domain actually has discrete groups, not a continuous distribution. Most behavioral data is continuous — clustering imposes discretization. Use clustering to generate hypotheses, not to discover ground truth.`,
    keyPoints: [
      `**Always evaluate clusters qualitatively — look at 20 random examples from each cluster and ask whether the segment makes business sense.**\n\nInternal metrics (silhouette, Davies-Bouldin) measure geometric quality, not business utility. A cluster with silhouette score 0.7 that mixes bargain hunters with power users is useless. Geometric quality and business utility are independent — you need both.`,
      `**Trap: treating the number of clusters K as a hyperparameter to optimize numerically.**\n\nK is a business decision: "How many user segments can our recommendation system actually serve distinctly?" Start from that constraint, then use the elbow method to verify feasibility — plot within-cluster sum of squares (WCSS) against K; WCSS drops fast at first and then flattens, and the "elbow" is the K where the drop visibly bends from steep to shallow, marking the point where adding more clusters stops buying much tighter fit. Optimizing K on the silhouette score alone divorces the clustering from its purpose.`,
      `**Diagnostic: if silhouette scores are near 0 for all K values you try, your data does not have cluster structure under that algorithm's geometry.**\n\nTry a different algorithm — DBSCAN for density-based structure — or transform the feature space. Near-zero silhouette across all K is a signal about the data and the algorithm's fit to it, not just a bad hyperparameter choice.`,
    ],
    checkQuestions: [
      {
        q: `A clustering of customers produces 5 clusters with silhouette score=0.62. A domain expert says 3 of the clusters look identical in terms of purchasing behaviour. How do you reconcile this?`,
        options: [
          `A) Trust the silhouette score — 0.62 is strong evidence the 5 clusters are genuinely distinct, so the expert is likely mistaken here after all`,
          `B) Re-run the clustering with a different random seed and check whether the expert observation persists across multiple runs`,
          `C) Silhouette measures geometric separation, not semantic similarity — revisit feature selection, not noise dimensions`,
          `D) Increase k to 8 so the similar clusters subdivide further, forcing more geometric separation between the resulting sub-groups`,
        ],
        answer: `C`,
      },
      {
        q: `Which two of the following are true when comparing k-means (silhouette=0.71) against DBSCAN (silhouette=0.43) on the same dataset?`,
        options: [
          `A) Silhouette is biased toward convex, spherical clusters, so a lower DBSCAN score does not necessarily mean the clustering is worse`,
          `B) DBSCAN can score lower yet still be correctly recovering non-convex, density-based structure that k-means cannot represent at all`,
          `C) A higher silhouette score always means objectively better clustering quality, independent of the true cluster shapes present`,
          `D) k-means always produces more stable clusters than DBSCAN because its centroid updates are fully deterministic across seeds`,
        ],
        answer: [`A`, `B`],
      },
      {
        q: `A colleague proposes using k-means with k=150 to cluster 10,000 user-behaviour vectors with 512 features. What are the failure modes?`,
        options: [
          `A) The only real problem is runtime — k=150 will be slow to converge but will still produce valid, meaningful clusters once it finishes fully`,
          `B) k-means cannot handle more than 100 clusters on any dataset — sklearn silently caps k at 100 during centroid initialisation`,
          `C) Mini-batch k-means should be used instead of full-batch k-means, which resolves all three problems automatically and for free`,
          `D) Three compounding problems: curse of dimensionality at 512 features, k=150 gives unstable micro-clusters of ~67 points, init sensitivity`,
        ],
        answer: `D`,
      },
      {
        q: `You need to explain to a non-technical stakeholder why you cannot report "clustering accuracy." What do you say?`,
        options: [
          `A) Accuracy can be computed, but it requires running the clustering several times to average results across different random seeds used`,
          `B) Accuracy needs known correct labels for comparison — clustering is unsupervised, so report silhouette score and business validation`,
          `C) Accuracy is technically computable but misleading here, so instead we report WCSS as the primary quality metric to stakeholders`,
          `D) Accuracy requires at least 10,000 samples to be meaningful; below that threshold, only the silhouette score is considered valid`,
        ],
        answer: `B`,
      },
    ],
    interactivePrompt: `Before you touch the controls: what assumption about cluster shape does K-means make, and what kind of data would violate it?`,
    takeaway: `Choosing a clustering algorithm is choosing an assumption about what "similar" means — and the algorithm will always produce confident groups regardless of whether those groups reflect real structure or just its geometric constraints.`,
    recap: [
      "**No labels = no accuracy:** clustering finds structure, cannot measure \"correct.\"",
      "**Choosing the algorithm = choosing an assumption:** K-means spherical, DBSCAN density-separated, hierarchical nested.",
      "**Wrong assumption → confident, stable, wrong clusters.**",
      "**Internal metrics** (silhouette, Davies-Bouldin, Calinski-Harabasz) measure geometry, not business utility.",
      "**Real test = business validity:** pull 20 per cluster, ask \"does this make sense?\"",
      "**K is a business decision,** not a metric to optimize.",
      "**Near-zero silhouette across all K = no cluster structure** under that geometry.",
      "**Next up:** each family gets its own deep-dive — K-Means Clustering, DBSCAN, and Hierarchical Clustering modules follow this one.",
    ],
    figures: {
      cluster_shapes: `<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">each algorithm assumes a different cluster shape</text>
  <!-- Panel 1: spherical (K-means) -->
  <g transform="translate(0,30)">
    <text x="60" y="12" text-anchor="middle" fill="var(--prime)" font-size="10" font-weight="700">spherical</text>
    <text x="60" y="150" text-anchor="middle" fill="var(--ink-low)" font-size="8">K-means</text>
    <circle cx="45" cy="60" r="24" fill="var(--prime)" opacity="0.12" stroke="var(--prime)" stroke-width="1"/>
    <circle cx="82" cy="95" r="24" fill="var(--amber)" opacity="0.14" stroke="var(--amber)" stroke-width="1"/>
    <g fill="var(--prime)" opacity="0.9">
      <circle cx="40" cy="55" r="2.5"/><circle cx="52" cy="62" r="2.5"/><circle cx="45" cy="70" r="2.5"/><circle cx="38" cy="66" r="2.5"/><circle cx="50" cy="52" r="2.5"/>
    </g>
    <g fill="var(--amber)" opacity="0.9">
      <circle cx="78" cy="90" r="2.5"/><circle cx="88" cy="98" r="2.5"/><circle cx="82" cy="104" r="2.5"/><circle cx="90" cy="88" r="2.5"/><circle cx="76" cy="100" r="2.5"/>
    </g>
  </g>
  <line x1="120" y1="34" x2="120" y2="180" stroke="var(--rim)" stroke-width="1"/>
  <!-- Panel 2: density / crescent (DBSCAN) -->
  <g transform="translate(120,30)">
    <text x="60" y="12" text-anchor="middle" fill="var(--prime)" font-size="10" font-weight="700">density</text>
    <text x="60" y="150" text-anchor="middle" fill="var(--ink-low)" font-size="8">DBSCAN</text>
    <!-- two interleaved crescents -->
    <path d="M 30 110 A 34 34 0 0 1 96 70" fill="none" stroke="var(--prime)" stroke-width="8" stroke-linecap="round" opacity="0.75"/>
    <path d="M 96 118 A 34 34 0 0 1 30 78" fill="none" stroke="var(--amber)" stroke-width="8" stroke-linecap="round" opacity="0.75"/>
    <!-- lone noise point -->
    <circle cx="100" cy="45" r="3" fill="var(--ink-low)"/>
    <text x="108" y="43" fill="var(--ink-low)" font-size="7">noise</text>
  </g>
  <line x1="240" y1="34" x2="240" y2="180" stroke="var(--rim)" stroke-width="1"/>
  <!-- Panel 3: nested (hierarchical) -->
  <g transform="translate(240,30)">
    <text x="60" y="12" text-anchor="middle" fill="var(--prime)" font-size="10" font-weight="700">nested</text>
    <text x="60" y="150" text-anchor="middle" fill="var(--ink-low)" font-size="8">hierarchical</text>
    <circle cx="60" cy="88" r="46" fill="none" stroke="var(--ink-low)" stroke-width="1" stroke-dasharray="4,3" opacity="0.7"/>
    <circle cx="44" cy="80" r="20" fill="var(--prime)" opacity="0.12" stroke="var(--prime)" stroke-width="1"/>
    <circle cx="80" cy="98" r="20" fill="var(--amber)" opacity="0.14" stroke="var(--amber)" stroke-width="1"/>
    <g fill="var(--prime)" opacity="0.9"><circle cx="40" cy="76" r="2.5"/><circle cx="50" cy="84" r="2.5"/><circle cx="44" cy="88" r="2.5"/></g>
    <g fill="var(--amber)" opacity="0.9"><circle cx="76" cy="94" r="2.5"/><circle cx="86" cy="102" r="2.5"/><circle cx="80" cy="106" r="2.5"/></g>
  </g>
</svg>`,
    },
  },
  {
    id: 'kmeans',
    interactiveId: 'kmeans_viz',
    title: 'K-Means Clustering',
    subtitle: `Lloyd's algorithm, k-means++ init, silhouette, failure modes`,
    difficulty: 'foundational',
    estimatedMin: 36,
    tags: ['k-means', 'clustering', `Lloyd's algorithm`],
    summary: `You have 100,000 user embeddings and want 5 segments. K-means: randomly initialize 5 centroids. Step 1 (assignment) — assign each user to the nearest centroid by Euclidean distance. Step 2 (update) — move each centroid to the mean of all users assigned to it. Repeat until assignments stop changing. This is Lloyd's algorithm. It is guaranteed to converge. It is not guaranteed to find the global optimum.

[FIGURE: kmeans_steps]

K-means minimizes the within-cluster sum of squared distances (inertia): Σₖ Σᵢ ∈ cluster k ‖xᵢ - μₖ‖². This is NP-hard in general — K-means finds a local minimum. The result depends on initialization. K-means++ fixes this: choose the first centroid uniformly at random, then each subsequent centroid with probability proportional to the squared distance from the nearest existing centroid. This produces better local optima with fewer restarts. sklearn uses k-means++ by default; note that sklearn's default n_init changed in v1.4 to 'auto', which resolves to a single run when init='k-means++' (versions before 1.4 defaulted to n_init=10).

Elbow method: plot inertia vs K. Inertia always decreases as K increases — more clusters always fit tighter. Look for the elbow where marginal gain of adding a cluster drops off. This is approximate and often there is no clear elbow in real data.

Silhouette score is a per-point diagnostic: it compares each point's average distance to points in its own cluster (cohesion) against its average distance to points in the nearest other cluster (separation), and ranges from -1 to 1 — near 1 means well-clustered, near 0 means the point sits on a cluster boundary, and negative means it was probably assigned to the wrong cluster. Averaged across all points, scores below roughly 0.25 signal weak or absent structure (e.g., curse-of-dimensionality noise) — so a uniformly low average like 0.08-0.12 across every K tested is a structural warning that no choice of K will fix, not a sign you have not found the right K yet.

Three structural limitations to know. First: K-means assumes spherical clusters (Euclidean distance to centroid). If your data has non-spherical or unequal-density clusters, K-means draws the wrong boundaries regardless of K. Second: sensitive to outliers — one outlier pulls a centroid far from the cluster. (K-medoids addresses this directly by using an actual data point, the medoid, as the cluster center instead of the mean — more robust to outliers and more interpretable, at higher compute cost; choose k-medoids over k-means when outliers or interpretability matter more than speed.) Third: requires specifying K in advance, and an incorrect K produces confident but wrong assignments.

K-means also has a probabilistic reading, covered in full in the GMM module: a Gaussian Mixture Model fits several Gaussian "components" (bell-curve clusters, each with its own center and spread) to the data using Expectation-Maximization (EM), a soft version of K-means that assigns each point a probability of belonging to each component instead of one hard label. K-means is exactly the hard-assignment limit of that EM process when every component is forced to share the same isotropic covariance σ²I (the same, direction-independent spread) and σ→0: as σ shrinks toward 0, each point's soft, probabilistic membership collapses into an all-or-nothing 1-or-0 vote for whichever component is nearest — precisely K-means' nearest-centroid assignment step. That equivalence is also where K-means' spherical, equal-radius cluster assumption comes from; see the GMM module for the full derivation.

NOT-this: "K-means finds the natural clusters." K-means partitions space into Voronoi cells — every point gets assigned to the nearest centroid. Try DBSCAN or GMM when clusters are not spherical or equal in size.`,
    keyPoints: [
      `**Always run K-means with K-means++ initialization and n_init=10 — a single random initialization frequently gets trapped in a poor local minimum.**\n\nRunning 10 times and taking the best result (lowest inertia) adds 10× compute but significantly improves cluster quality. As of sklearn 1.4, this is no longer the default (n_init now defaults to 'auto', which runs only once with k-means++ init) — so set n_init=10 explicitly rather than relying on the default.`,
      `**Trap: using K-means on high-dimensional data without dimensionality reduction.**\n\nIn high dimensions, Euclidean distance concentrates — all points become approximately equidistant, making centroid-based assignment meaningless. Apply PCA to 20–50 dimensions first. This is not optional at 100+ features; it is the difference between signal and noise.`,
      `**Diagnostic: after clustering, compute the per-cluster variance of key business metrics (revenue, engagement).**\n\nIf all clusters have similar metric distributions, the clustering is not capturing meaningful signal. Try different features or a different algorithm. Clusters that look geometrically clean but collapse to the same business profile have not solved the segmentation problem.`,
    ],
    checkQuestions: [
      {
        q: `K-means gives very different results on different runs on the same dataset. What is wrong and how do you fix it?`,
        options: [
          `A) The dataset has non-spherical clusters — switching to DBSCAN, which is fully deterministic given fixed parameters, would fix this`,
          `B) Use a fixed random seed across runs — this guarantees k-means finds the global optimum of the WCSS objective every time`,
          `C) Different runs converge to different local optima from random init — fix with k-means++ init plus multiple restarts (n_init>1)`,
          `D) The k value is wrong — instability across runs always means k has been set too high relative to the true cluster count`,
        ],
        answer: `C`,
      },
      {
        q: `You apply k-means to 50,000 customer vectors with 200 features. Silhouette scores are uniformly low (0.08–0.12) for all k from 2 to 20. What does this tell you and what do you do?`,
        options: [
          `A) Uniformly low silhouette across all k signals the curse of dimensionality or absent structure — apply PCA to ~20-30 dims and re-inspect`,
          `B) The silhouette threshold for high-dimensional data is lower — scores of 0.08 to 0.12 are actually acceptable once you exceed 200 features`,
          `C) Increase k beyond 20 — silhouette scores will keep improving once k is large enough to capture fine-grained subgroups reliably`,
          `D) Switch to hierarchical clustering instead — silhouette is mathematically incompatible with k-means on large, high-dimensional datasets`,
        ],
        answer: `A`,
      },
      {
        q: `A k-means run with k=5 produces one cluster with 90% of the data and four clusters each with 2-3%. What likely went wrong?`,
        options: [
          `A) The dataset is too large for k-means to handle well at all — switch to MiniBatchKMeans whenever one cluster ends up dominating`,
          `B) k=5 may be too high, or outliers each captured a tiny cluster, or init placed centroids in low-density regions — try k=2,3`,
          `C) The silhouette metric should be fully replaced with WCSS whenever diagnosing unequal cluster sizes produced by a k-means run`,
          `D) This is expected, normal behaviour for k-means on any imbalanced dataset — use per-cluster class weights to rebalance the sizes`,
        ],
        answer: `B`,
      },
      {
        q: `What is the difference between k-means and k-medoids, and when would you choose each?`,
        options: [
          `A) K-means is faster but only works on strictly binary data; k-medoids is required whenever features are continuous-valued`,
          `B) They are mathematically identical — the only difference is that k-medoids always uses Manhattan distance instead of Euclidean`,
          `C) K-means uses the mean as centroid; k-medoids uses an actual data point — choose it for outliers or interpretability needs`,
          `D) K-medoids always produces strictly better clusters than k-means — k-means should only be used when runtime is the top concern`,
        ],
        answer: `C`,
      },
      {
        q: `Which two of the following are true about why k-means is equivalent to EM on a specific probabilistic model?`,
        options: [
          `A) K-means is the hard-assignment limit of EM on a GMM as σ→0, where all components share the same isotropic covariance`,
          `B) This equivalence reveals that k-means implicitly assumes spherical, equal-radius clusters with hard, all-or-nothing membership`,
          `C) K-means is equivalent to EM on a Poisson mixture model, which is why it assumes count-distributed integer features throughout`,
          `D) K-means replaces the EM M-step with gradient descent, so the relationship is only a similar update rule, not a true equivalence`,
        ],
        answer: [`A`, `B`],
      },
    ],
    interactivePrompt: `Before you touch the controls: if you ran K-means twice on the same data with different random seeds and got different clusters, what does that tell you and what would you do?`,
    takeaway: `K-means converges every time — the dangerous part is that it converges just as confidently when clusters are non-spherical, unequal in size, or initialization was poor as when everything is perfect.`,
    recap: [
      "**Lloyd's algorithm:** assign to nearest centroid → move centroid to mean → repeat.",
      "**Converges always, global optimum never** — minimizes inertia $\\Sigma\\|x_i-\\mu_k\\|^2$, NP-hard, local min.",
      "**K-means++ + n_init=10:** distance-weighted init beats random restarts (sklearn default).",
      "**Elbow method:** inertia always drops with K — look for the knee.",
      "**Three limits:** assumes spherical clusters, outlier-sensitive, K fixed in advance.",
      "**High-D first reduce:** distances concentrate → PCA to 20–50 dims before clustering.",
      "**Hard-assignment limit of EM on GMM** with shared isotropic $\\sigma^2 I$, $\\sigma\\to0$.",
    ],
    interactiveId: 'kmeans_viz',
    figures: {
      kmeans_steps: `<svg viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:480px;font-family:var(--font-sans,sans-serif)">
  <!-- Panel 1: Init -->
  <g transform="translate(10,30)">
    <text x="70" y="-12" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">1. Init</text>
    <!-- scattered points (3 natural clusters roughly) -->
    <g fill="var(--ink-low)" opacity="0.8">
      <circle cx="30" cy="40" r="4"/><circle cx="45" cy="55" r="4"/><circle cx="20" cy="60" r="4"/>
      <circle cx="80" cy="30" r="4"/><circle cx="95" cy="45" r="4"/><circle cx="110" cy="35" r="4"/>
      <circle cx="55" cy="110" r="4"/><circle cx="70" cy="125" r="4"/><circle cx="40" cy="120" r="4"/>
    </g>
    <!-- 3 centroids (stars = larger circles) at random positions -->
    <circle cx="50" cy="30" r="7" fill="none" stroke="var(--prime)" stroke-width="2.5"/>
    <circle cx="90" cy="90" r="7" fill="none" stroke="var(--amber)" stroke-width="2.5"/>
    <circle cx="110" cy="110" r="7" fill="none" stroke="var(--ink-mid)" stroke-width="2.5"/>
    <text x="52" y="20" fill="var(--prime)" font-size="8">★</text>
    <text x="92" y="80" fill="var(--amber)" font-size="8">★</text>
    <text x="112" y="100" fill="var(--ink-mid)" font-size="8">★</text>
  </g>
  <!-- divider -->
  <line x1="155" y1="15" x2="155" y2="185" stroke="var(--rim)" stroke-width="1"/>
  <!-- Panel 2: Assign -->
  <g transform="translate(165,30)">
    <text x="70" y="-12" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">2. Assign</text>
    <g>
      <circle cx="30" cy="40" r="4" fill="var(--prime)" opacity="0.8"/>
      <circle cx="45" cy="55" r="4" fill="var(--prime)" opacity="0.8"/>
      <circle cx="20" cy="60" r="4" fill="var(--prime)" opacity="0.8"/>
      <circle cx="80" cy="30" r="4" fill="var(--amber)" opacity="0.8"/>
      <circle cx="95" cy="45" r="4" fill="var(--amber)" opacity="0.8"/>
      <circle cx="110" cy="35" r="4" fill="var(--amber)" opacity="0.8"/>
      <circle cx="55" cy="110" r="4" fill="var(--ink-mid)" opacity="0.8"/>
      <circle cx="70" cy="125" r="4" fill="var(--ink-mid)" opacity="0.8"/>
      <circle cx="40" cy="120" r="4" fill="var(--ink-mid)" opacity="0.8"/>
    </g>
    <!-- centroids same as before -->
    <circle cx="50" cy="30" r="7" fill="none" stroke="var(--prime)" stroke-width="2.5"/>
    <circle cx="90" cy="90" r="7" fill="none" stroke="var(--amber)" stroke-width="2.5"/>
    <circle cx="110" cy="110" r="7" fill="none" stroke="var(--ink-mid)" stroke-width="2.5"/>
  </g>
  <!-- divider -->
  <line x1="315" y1="15" x2="315" y2="185" stroke="var(--rim)" stroke-width="1"/>
  <!-- Panel 3: Update -->
  <g transform="translate(325,30)">
    <text x="70" y="-12" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">3. Update</text>
    <g>
      <circle cx="30" cy="40" r="4" fill="var(--prime)" opacity="0.8"/>
      <circle cx="45" cy="55" r="4" fill="var(--prime)" opacity="0.8"/>
      <circle cx="20" cy="60" r="4" fill="var(--prime)" opacity="0.8"/>
      <circle cx="80" cy="30" r="4" fill="var(--amber)" opacity="0.8"/>
      <circle cx="95" cy="45" r="4" fill="var(--amber)" opacity="0.8"/>
      <circle cx="110" cy="35" r="4" fill="var(--amber)" opacity="0.8"/>
      <circle cx="55" cy="110" r="4" fill="var(--ink-mid)" opacity="0.8"/>
      <circle cx="70" cy="125" r="4" fill="var(--ink-mid)" opacity="0.8"/>
      <circle cx="40" cy="120" r="4" fill="var(--ink-mid)" opacity="0.8"/>
    </g>
    <!-- new centroids at cluster means -->
    <circle cx="32" cy="52" r="7" fill="none" stroke="var(--prime)" stroke-width="2.5"/>
    <circle cx="95" cy="37" r="7" fill="none" stroke="var(--amber)" stroke-width="2.5"/>
    <circle cx="55" cy="118" r="7" fill="none" stroke="var(--ink-mid)" stroke-width="2.5"/>
    <!-- arrows showing movement -->
    <line x1="50" y1="30" x2="34" y2="50" stroke="var(--prime)" stroke-width="1.2" stroke-dasharray="3,2" marker-end="url(#arrowK1)"/>
    <line x1="90" y1="90" x2="95" y2="44" stroke="var(--amber)" stroke-width="1.2" stroke-dasharray="3,2" marker-end="url(#arrowK2)"/>
    <line x1="110" y1="110" x2="58" y2="120" stroke="var(--ink-mid)" stroke-width="1.2" stroke-dasharray="3,2" marker-end="url(#arrowK3)"/>
    <defs>
      <marker id="arrowK1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L5,3 L0,6 Z" fill="var(--prime)"/></marker>
      <marker id="arrowK2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L5,3 L0,6 Z" fill="var(--amber)"/></marker>
      <marker id="arrowK3" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L5,3 L0,6 Z" fill="var(--ink-mid)"/></marker>
    </defs>
  </g>
</svg>`,
    },
  },
  {
    id: 'hierarchical',
    title: 'Hierarchical Clustering',
    subtitle: 'Linkage criteria, dendrograms, when hierarchy beats flat clustering',
    difficulty: 'intermediate',
    estimatedMin: 34,
    tags: ['hierarchical clustering', 'dendrogram', 'linkage'],
    summary: `You have 500 customer support tickets. You need to organize them into a hierarchy — broad themes (Product Bug, Billing, UX) and sub-themes (Product Bug: Login, Checkout, API). K-means gives you flat clusters and requires you to commit to K before seeing results. Hierarchical clustering builds a tree — the dendrogram — that you cut at any level to get the granularity you want. One run gives you every possible K simultaneously.

Agglomerative clustering (bottom-up): start with each point as its own cluster. Merge the two closest clusters. Repeat until all points are in one cluster. The merge history forms the dendrogram, where the y-axis records the distance at each merge.

The linkage criterion determines what "distance between clusters" means. Single linkage: distance between the closest pair of points across clusters — produces elongated "chaining" clusters. Complete linkage: distance between the farthest pair — produces compact clusters. Average linkage: average distance between all pairs. Ward's linkage: merges the pair that minimizes total within-cluster variance after merging. Ward produces compact, equal-variance clusters and is almost always the best default.

Reading the dendrogram: long vertical segments mark natural cluster boundaries — a large jump in merge distance means the two groups being merged were genuinely far apart. Draw a horizontal cut line; each branch it crosses is one cluster. If there are no long segments, the data probably does not have discrete structure.

[FIGURE: dendrogram]

Complexity: O(n²) space for the distance matrix, O(n³) time for the naive merge sequence. Infeasible for n > 10,000. For large datasets use HDBSCAN or approximate methods.

NOT-this: "You need to specify K before running hierarchical clustering." The whole point is you do not. You run once, get the full dendrogram, inspect it, and decide where to cut based on the structure. You can cut at different heights for different analysis needs without rerunning — that is the main advantage over K-means.`,
    keyPoints: [
      `**Use hierarchical clustering with Ward linkage when you need interpretable nested structure and n < 10,000.**\n\nThe dendrogram gives you all granularity levels in one run — you can read off 3 clusters, 7 clusters, or 20 clusters without refitting. Product taxonomies, gene pathway hierarchies, and support ticket category trees are the right domain for this method.`,
      `**Trap: running hierarchical clustering on raw high-dimensional features.**\n\nPairwise distance computation in 1000 dimensions is dominated by noise — every pair looks roughly equidistant. Reduce to 20–50 PCA components first. Without this step, the distances driving the dendrogram are measuring noise, not structure.`,
      `**Diagnostic: if the dendrogram shows one large cluster absorbing all others at the last step, your data has one dominant cluster with outliers.**\n\nUse DBSCAN to explicitly model noise points rather than forcing them into clusters. A dendrogram with no long vertical segments carries the same signal — discrete cluster structure is absent from this data under this algorithm.`,
    ],
    checkQuestions: [
      {
        q: `You are clustering genes based on expression profiles. Why might hierarchical clustering with Ward linkage be more appropriate than k-means?`,
        options: [
          `A) Hierarchical clustering is always preferred for biological data purely because gene expression features are non-Gaussian in distribution`,
          `B) Ward linkage specifically handles the high dimensionality of gene expression data far better than k-means centroids ever could`,
          `C) K-means is faster, but hierarchical clustering becomes strictly necessary once the dataset has more than 500 genes to cluster`,
          `D) Genes have a natural pathway-module-process hierarchy — one run gives every granularity, and Ward gives compact co-expression groups`,
        ],
        answer: `D`,
      },
      {
        q: `Two researchers use the same dataset but different linkage criteria. Researcher A uses single linkage and gets one large cluster containing 95% of the data. Researcher B uses Ward linkage and gets 5 balanced clusters. Which two statements correctly explain when each researcher is right?`,
        options: [
          `A) If the data is filamentary or chain-shaped, single linkage one large cluster can be the structurally correct answer here`,
          `B) If the data is really five distinct blobs joined only by thin bridges, Ward linkage balanced clusters can be correct`,
          `C) Single linkage always produces degenerate chaining results and should never be used on any real dataset whatsoever`,
          `D) One large cluster from single linkage always proves the data has no true subgroup structure of any kind at all`,
        ],
        answer: [`A`, `B`],
      },
      {
        q: `How do you determine the optimal cut height on a dendrogram when there is no obvious long gap?`,
        options: [
          `A) Always cut at the median linkage height across the whole dendrogram, since this reliably maximises balance between the resulting clusters`,
          `B) The absence of a long gap proves conclusively that the data has no cluster structure at all — stop and use a different algorithm entirely`,
          `C) Use the acceleration plot, silhouette across cuts, domain knowledge, or a GMM BIC curve — no method is authoritative here alone`,
          `D) Use complete linkage instead of Ward linkage — complete linkage always produces measurably clearer gaps in the resulting dendrogram`,
        ],
        answer: `C`,
      },
      {
        q: `A colleague wants to run hierarchical clustering on 100,000 points. What do you tell them?`,
        options: [
          `A) Use single linkage — its SLINK implementation runs in O(n log n) time and handles 100,000 points easily without any real issue`,
          `B) Hierarchical clustering is feasible up to 500,000 points with modern hardware; the O(n²) limit only applies to Ward linkage`,
          `C) Subsample to 10,000 points, run hierarchical clustering on that subsample, then assign remaining points by nearest-centroid`,
          `D) Naive clustering on 100,000 points needs ~40GB and months of O(n³) compute — use HDBSCAN, BIRCH+agglomerative, or subsample`,
        ],
        answer: `D`,
      },
    ],
    interactivePrompt: `Before you touch the controls: what does a long vertical segment in a dendrogram tell you, and what does its absence tell you?`,
    takeaway: `The dendrogram encodes cluster structure at every granularity in one run — natural boundaries appear as long vertical segments, and the absence of those segments means discrete cluster structure is probably not there.`,
    recap: [
      "**Dendrogram = every K in one run:** cut at any height, no need to commit K.",
      "**Agglomerative (bottom-up):** each point its own cluster → merge closest → repeat.",
      "**Linkage = definition of cluster distance:** single (chaining), complete (compact), average, Ward (min variance).",
      "**Ward is the near-universal default** — compact, equal-variance clusters.",
      "**Read the tree:** long vertical segments = natural boundaries; none = no discrete structure.",
      "**Cost:** $O(n^2)$ space, $O(n^3)$ time — infeasible past ~10,000 points; use HDBSCAN.",
      "**Reduce to 20–50 PCA dims first** — raw high-D distances measure noise.",
    ],
    interactiveId: 'hierarchical_clustering_viz',
    figures: {
      dendrogram: `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">read the tree: long segments = real boundaries</text>
  <!-- y-axis (merge distance) -->
  <line x1="34" y1="30" x2="34" y2="180" stroke="var(--rim)" stroke-width="1"/>
  <text x="20" y="110" text-anchor="middle" fill="var(--ink-low)" font-size="8" transform="rotate(-90 20 110)">merge distance</text>
  <!-- leaves at bottom: 6 points at x = 60,90,120,180,210,240 ; y=180 -->
  <!-- Left group: (A,B) merge low, then join C -->
  <line x1="60" y1="180" x2="60" y2="150" stroke="var(--prime)" stroke-width="1.5"/>
  <line x1="90" y1="180" x2="90" y2="150" stroke="var(--prime)" stroke-width="1.5"/>
  <line x1="60" y1="150" x2="90" y2="150" stroke="var(--prime)" stroke-width="1.5"/>
  <line x1="75" y1="150" x2="75" y2="128" stroke="var(--prime)" stroke-width="1.5"/>
  <line x1="120" y1="180" x2="120" y2="128" stroke="var(--prime)" stroke-width="1.5"/>
  <line x1="75" y1="128" x2="120" y2="128" stroke="var(--prime)" stroke-width="1.5"/>
  <line x1="97" y1="128" x2="97" y2="70" stroke="var(--prime)" stroke-width="1.5"/>
  <!-- Right group: (D,E) then join F -->
  <line x1="180" y1="180" x2="180" y2="152" stroke="var(--amber)" stroke-width="1.5"/>
  <line x1="210" y1="180" x2="210" y2="152" stroke="var(--amber)" stroke-width="1.5"/>
  <line x1="180" y1="152" x2="210" y2="152" stroke="var(--amber)" stroke-width="1.5"/>
  <line x1="195" y1="152" x2="195" y2="132" stroke="var(--amber)" stroke-width="1.5"/>
  <line x1="240" y1="180" x2="240" y2="132" stroke="var(--amber)" stroke-width="1.5"/>
  <line x1="195" y1="132" x2="240" y2="132" stroke="var(--amber)" stroke-width="1.5"/>
  <line x1="217" y1="132" x2="217" y2="70" stroke="var(--amber)" stroke-width="1.5"/>
  <!-- final merge (the long jump) -->
  <line x1="97" y1="70" x2="217" y2="70" stroke="var(--ink-mid)" stroke-width="1.5"/>
  <!-- long-segment annotation: the tall vertical up to the final merge -->
  <rect x="93" y="72" width="8" height="54" fill="var(--prime)" opacity="0.12"/>
  <text x="150" y="60" text-anchor="middle" fill="var(--ink-mid)" font-size="8">long jump = groups far apart</text>
  <!-- cut line -->
  <line x1="40" y1="100" x2="300" y2="100" stroke="var(--green)" stroke-width="1.4" stroke-dasharray="5,3"/>
  <text x="316" y="103" fill="var(--green)" font-size="8" font-weight="700">cut → 2</text>
  <!-- leaf labels -->
  <g fill="var(--ink-low)" font-size="8" text-anchor="middle">
    <text x="60" y="192">A</text><text x="90" y="192">B</text><text x="120" y="192">C</text>
    <text x="180" y="192">D</text><text x="210" y="192">E</text><text x="240" y="192">F</text>
  </g>
  <text x="180" y="210" text-anchor="middle" fill="var(--ink-low)" font-size="8">each branch the cut crosses = one cluster</text>
</svg>`,
    },
  },
  {
    id: 'dbscan',
    interactiveId: 'dbscan_viz',
    title: 'DBSCAN',
    subtitle: 'Core/border/noise points, eps and minPts, non-spherical clusters',
    difficulty: 'intermediate',
    estimatedMin: 36,
    tags: ['DBSCAN', 'density-based', 'outlier detection'],
    summary: `You have geographic data — customer addresses mapped to (lat, lon). You want to find city clusters of any shape. K-means would fit circles; cities are not circles. DBSCAN finds density-connected regions of arbitrary shape and labels sparse areas as noise. A city center is a dense region; a rural highway stop is noise. No K to specify — the number of clusters emerges from the data's density structure.

DBSCAN parameters: ε (epsilon) — the radius defining "neighborhood." minPts — the minimum number of points in the ε-neighborhood to be a core point. Core point: has ≥ minPts points within distance ε. Border point: within ε of a core point but not itself a core point. Noise point: not within ε of any core point — explicitly labeled -1.

[FIGURE: core_border_noise]

Density reachability: point A is directly density-reachable from core point B if A is in B's ε-neighborhood. A cluster is the connected component of core points plus their border points. The chain-following is what lets clusters take any shape — crescents, rings, L-shapes.

Parameter selection: minPts = 2 × dimensions (rule of thumb). For ε: sort all pairwise distances to the k-th nearest neighbor (k = minPts), plot the k-distance graph, pick ε at the knee where distances jump.

NOT-this: "DBSCAN does not require K, so it is always better than K-means." DBSCAN has two equally tricky hyperparameters: ε and minPts. If ε is too small, most points are noise. If too large, all points merge into one cluster. And DBSCAN does not handle clusters of varying density well — dense and sparse clusters need different ε values. HDBSCAN (hierarchical DBSCAN) handles variable density and is almost always better than vanilla DBSCAN in practice.`,
    keyPoints: [
      `**Use DBSCAN when your clusters are non-spherical or vary in size, when noise or outlier detection is important, and when you do not know K.**\n\nGeospatial and graph neighborhood data are ideal. The explicit noise label (-1) is operationally valuable — route ambiguous points to human review rather than forcing overconfident cluster assignments.`,
      `**Trap: DBSCAN is O(n²) without a spatial index. On 1M+ points, build a KD-tree or ball tree first — sklearn's DBSCAN does this automatically with algorithm=\`'auto'\` for low dimensions.**\n\nAbove 20 dimensions, spatial indices degrade back to O(n²) anyway. For high-dimensional data, use HDBSCAN with UMAP preprocessing to first reduce to a meaningful low-dimensional space.`,
      `**Diagnostic: if DBSCAN produces one giant cluster containing 90% of points, ε is too large. If it produces hundreds of tiny clusters, ε is too small.**\n\nPlot the k-distance graph for k=minPts and pick the elbow — this is the systematic way to set ε. No clear elbow means density-based clustering may not match the structure of your data.`,
    ],
    checkQuestions: [
      {
        q: `K-means gives 5 circular clusters on GPS location data, but you suspect the true structure has non-circular geographic regions. Which two of the following are the correct setup and validation steps for DBSCAN here?`,
        options: [
          `A) Use the k-distance plot with k=4 (matching minPts) to find eps at the knee of the sorted distance curve`,
          `B) Validate by inspecting clusters on a map for geographic boundary alignment and checking that noise is genuinely sparse`,
          `C) Set eps by taking the mean pairwise distance and dividing by 10, which is the standard, widely accepted GPS calibration rule`,
          `D) DBSCAN is not suitable for GPS data at all, because lat/lon coordinates require spherical distance, which it does not support`,
        ],
        answer: [`A`, `B`],
      },
      {
        q: `DBSCAN with eps=0.5 and minPts=5 produces 1 cluster containing 95% of data and 200 noise points. What does this indicate and what do you try?`,
        options: [
          `A) eps is too small — the radius is not wide enough to connect the dense regions into their own natural clusters correctly here`,
          `B) minPts is too high — reducing it all the way down to 2 will split the single large cluster into meaningful subgroups too`,
          `C) One giant cluster means eps is too large — reduce via the k-distance knee; if no gap exists, try another algorithm entirely`,
          `D) The 200 noise points indicate the dataset has significant outliers preventing proper cluster formation — remove them first`,
        ],
        answer: `C`,
      },
      {
        q: `You apply DBSCAN to customer embeddings in 128 dimensions and get mostly noise (90% of points labelled -1). What is happening and how do you fix it?`,
        options: [
          `A) The minPts value is set far too high for 128-dimensional data — reduce it all the way to 2 and simply re-run DBSCAN now`,
          `B) DBSCAN labels as noise any point that is not a core point, so 90% noise just means the dataset has few dense regions`,
          `C) The training data itself is contaminated — 90% of the points are genuine anomalies and only 10% are truly normal`,
          `D) In 128 dims, Euclidean distances converge so eps cannot discriminate neighbours — apply PCA/UMAP to 10-20 dims first`,
        ],
        answer: `D`,
      },
      {
        q: `What is the difference between noise in DBSCAN and outliers detected by Isolation Forest? When would you use each for anomaly detection?`,
        options: [
          `A) They are equivalent — both define anomalies as points with fewer than k neighbours within some fixed, pre-chosen radius`,
          `B) DBSCAN noise requires labelled normal data to calibrate eps and minPts; Isolation Forest is instead fully unsupervised`,
          `C) DBSCAN noise is density-local (sparse vs eps/minPts); Isolation Forest gives a global score — pick by dimensionality`,
          `D) Isolation Forest is always superior overall — DBSCAN noise labelling should only ever be a preprocessing step before it`,
        ],
        answer: `C`,
      },
    ],
    interactivePrompt: `Before you touch the controls: what happens to DBSCAN's output if ε is set too large, and what happens if it is set too small?`,
    takeaway: `DBSCAN finds clusters of any shape and labels outliers explicitly — but a single ε threshold breaks when clusters have different internal densities, which is exactly the problem HDBSCAN was built to fix.`,
    recap: [
      "**Density-connected regions of any shape;** sparse points labeled noise (-1). No K.",
      "**Core point:** ≥ minPts within ε. **Border:** near a core. **Noise:** near nothing.",
      "**Clusters follow chains of core points** → crescents, rings, L-shapes.",
      "**Params:** minPts ≈ 2×dims; set ε at the knee of the k-distance plot.",
      "**ε too small → all noise; ε too large → one giant cluster.**",
      "**Explicit -1 noise label is operationally valuable** — route to human review.",
      "**Fails on varying density** — single ε breaks; HDBSCAN fixes it.",
    ],
    interactiveId: 'dbscan_viz',
    figures: {
      core_border_noise: `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">core / border / noise (minPts = 4)</text>
  <!-- core point: dense neighborhood -->
  <circle cx="110" cy="100" r="38" fill="var(--prime)" opacity="0.08" stroke="var(--prime)" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="110" y1="100" x2="138" y2="100" stroke="var(--prime)" stroke-width="1" opacity="0.7"/>
  <text x="124" y="94" fill="var(--prime)" font-size="8">ε</text>
  <!-- neighbors of core (>= minPts) -->
  <g fill="var(--prime)" opacity="0.85">
    <circle cx="90" cy="85" r="3.5"/><circle cx="130" cy="88" r="3.5"/><circle cx="95" cy="120" r="3.5"/><circle cx="128" cy="118" r="3.5"/><circle cx="112" cy="130" r="3.5"/>
  </g>
  <!-- the core point itself -->
  <circle cx="110" cy="100" r="5.5" fill="var(--prime)"/>
  <text x="110" y="160" text-anchor="middle" fill="var(--prime)" font-size="9" font-weight="700">core</text>
  <text x="110" y="172" text-anchor="middle" fill="var(--ink-low)" font-size="7">≥ minPts in ε</text>
  <!-- border point: on the edge, within ε of core's neighbor but < minPts itself -->
  <circle cx="185" cy="112" r="30" fill="var(--amber)" opacity="0.07" stroke="var(--amber)" stroke-width="1" stroke-dasharray="4,3"/>
  <circle cx="185" cy="112" r="5.5" fill="var(--amber)"/>
  <line x1="150" y1="105" x2="185" y2="112" stroke="var(--amber)" stroke-width="1" opacity="0.6" stroke-dasharray="2,2"/>
  <text x="200" y="160" text-anchor="middle" fill="var(--amber)" font-size="9" font-weight="700">border</text>
  <text x="200" y="172" text-anchor="middle" fill="var(--ink-low)" font-size="7">near a core, sparse itself</text>
  <!-- noise point: isolated -->
  <circle cx="300" cy="60" r="5.5" fill="none" stroke="var(--ink-low)" stroke-width="2"/>
  <text x="300" y="88" text-anchor="middle" fill="var(--ink-low)" font-size="9" font-weight="700">noise (-1)</text>
  <text x="300" y="100" text-anchor="middle" fill="var(--ink-low)" font-size="7">near no core</text>
  <text x="180" y="205" text-anchor="middle" fill="var(--ink-low)" font-size="8">clusters = chains of cores + their borders; the rest is noise</text>
</svg>`,
    },
  },
  {
    id: 'pca',
    interactiveId: 'pca_viz',
    title: 'PCA — Principal Component Analysis',
    subtitle: 'Eigenvectors, explained variance, when to use and when it fails',
    difficulty: 'intermediate',
    estimatedMin: 38,
    tags: ['PCA', 'dimensionality reduction', 'eigenvectors', 'variance'],
    summary: `Imagine photographing a chair so someone can recognise it. You would not shoot it dead-on, where it collapses into a flat rectangle — you would pick the angle that shows the most at once: legs, seat, back. You are choosing the *viewpoint that keeps the most information*. **Principal Component Analysis (PCA)** does exactly this for data: it finds the best angle to view your features from, so that when you flatten them down to just a few numbers you keep as much of the variation as possible.

Here is where you need it. Say you have gene-expression data: 20,000 gene readings for only 500 patients. Feeding 20,000 features into a model with 500 examples is hopeless — far too many knobs, the features overlap heavily, and it is painfully slow. PCA squeezes those 20,000 down to maybe 20–50 new features that still capture over 90% of the variation — and, crucially, the new features do not overlap with each other.

---

**The one idea: find the directions of most spread.**

Picture your data as a cloud of points. In some directions the cloud is stretched out; in others it is thin. PCA finds the direction of *maximum spread* — that is the **first principal component**. Then the next direction of most spread that sits at a right angle to the first — the second component. And so on. Each point can then be described mostly by where it sits along these few directions, instead of by all 20,000 original numbers.

[FIGURE: pca_variance]

Each component comes with a number, its **explained variance** — the share of the total spread it accounts for. Add them up and you can say "the first 30 components capture 92% of everything," which is how you decide how many to keep. (Under the hood these directions are the eigenvectors of the data's covariance matrix, and their explained-variance numbers are the eigenvalues; libraries compute them with the SVD, which is more numerically stable. You do not need the machinery to use PCA well — but that is what is happening.)

You can also run PCA in reverse: from the few components, approximately rebuild the original features. In fact PCA is, provably, the *best possible* straight-line way to compress and rebuild — no linear method loses less information for the same number of components.

---

**The trap: PCA keeps *variance*, not *signal*.**

Here is the mistake almost everyone makes: "PCA removes noise." It does not. PCA keeps the *highest-variance* directions and throws away the low-variance ones — and it has no idea which of those is signal and which is noise. Sometimes the biggest source of variation in genomics data is a *batch effect* (which day the sample was processed), pure noise that PCA will lovingly preserve. And sometimes the thing you actually care about — a rare but important pattern — has *low* variance, so PCA quietly deletes it. So never assume PCA kept what matters: always compare a PCA-reduced model against the full-feature model on the real downstream task before you trust it.

And one setup detail you cannot skip: **standardise your features first**. PCA chases variance, so if income is measured in dollars (variance in the billions) and another feature is a 0/1 flag, income will dominate every component for no good reason. Put everything on the same scale before running PCA, every single time.

---

**PCA leaks too — fit it on the training fold only.**

PCA looks unsupervised and therefore safe, but it *learns from the data* (the components come from the covariance of the whole set). Fit PCA on all your data before splitting and the training rows already "know" the directions defined partly by the test rows — a genuine leak that inflates your score. The rule is the same as for scalers and imputers: **fit PCA on the training fold, then transform validation/test with those fixed components**. Wrap it in a scikit-learn Pipeline so cross-validation re-fits it inside every fold. And remember standardisation is part of this — fit the scaler on train too, not the full set.

---

**Whitening: decorrelate and equalise.**

By default PCA gives you decorrelated components with *different* variances (PC1 has the most). **Whitening** additionally rescales every component to unit variance, so the output is fully decorrelated *and* isotropic — sometimes what a downstream model wants. But there's a catch: whitening blows the low-variance components (which are often mostly noise) up to the same scale as the high-variance ones, so it can **amplify noise**. Use it when the downstream method assumes equal-variance inputs; skip it when the low-variance directions are junk you'd rather keep small.

---

**The assumptions, stated plainly.**

PCA rests on a few things worth naming: it's **linear** (it can only find straight-line directions — curved structure is invisible to it), it's **variance-based** (it equates "important" with "high spread," which isn't always true), and it's **sensitive to outliers** (a few extreme points can swing a component, since variance squares distances). If your structure is nonlinear, your signal is low-variance, or your data has heavy outliers, PCA's assumptions are working against you.

---

**Interpretability: loadings, but not business-readable.**

Each component is a **linear mixture of all your original features** (its **loadings** are the weights). You *can* inspect loadings — "PC1 is mostly income and home value" — but a component like "0.4·income − 0.2·age + 0.31·tenure − …" rarely maps to something you can explain to a stakeholder. So PCA trades away the plain interpretability that feature *selection* keeps. When explanations matter (regulated lending, medicine), prefer selection over reduction.

---

**Big or sparse data: randomized and truncated SVD.**

Classic PCA forms the full covariance matrix, which is expensive or impossible for very high-dimensional data (text with tens of thousands of terms). Two variants fix this: **randomized PCA** approximates the top components far faster, and **TruncatedSVD** works *directly on sparse matrices* without centering (so it doesn't destroy sparsity) — this is the standard "LSA" move for TF-IDF text. For high-dimensional or sparse inputs, reach for these rather than vanilla covariance PCA.

---

**Visualisation is not proof.**

A 2D PCA scatter (PC1 vs PC2) is great for a *rough* look — spotting gross structure or obvious outliers. But it captures only the top two directions, so it is **not proof of separability or cluster quality**: classes that overlap in the PCA plot may separate cleanly in the full space, and apparent clusters may be artefacts. Use the plot to generate hypotheses, then validate on the real task — never conclude "the classes aren't separable" from a PCA picture.

---

**The alternatives map.**

Match the tool to the goal. For **visualisation** of nonlinear structure, **t-SNE** or **UMAP** (they preserve local neighbourhoods far better than PCA's two axes). For **nonlinear preprocessing**, **kernel PCA** or an **autoencoder** (nonlinear compression). For keeping **explainable** original variables, **feature selection** instead of PCA. PCA remains the fast, stable default for *linear* compression and decorrelation — just don't force it onto jobs its assumptions don't fit.`,
    keyPoints: [
      `**Choose the number of components from the cumulative explained-variance curve — but confirm it on the real task.**\n\nA good starting rule is to keep enough components to cover 90–95% of the variance; plot the curve and look for the elbow where extra components stop adding much. Treat that as a starting point, not gospel — the signal you actually care about might live in a lower-variance component the rule would drop, so always check downstream performance at a few different component counts.`,
      `**The trap: forgetting to standardise before PCA.**\n\nPCA maximises variance, so if your features sit on wildly different scales, the biggest one (income in dollars, say) dominates every component regardless of how useful it is, and everything else gets crushed into components you later discard. Standardise every feature first (mean 0, unit variance) — no exceptions, unless the features are already on one scale and you genuinely want the big ones to dominate.`,
      `**The diagnostic: if the PCA-reduced model does clearly worse than the full one, the signal was in a low-variance direction — or the structure is not linear.**\n\nFirst try keeping more components. If that does not help, PCA's straight-line assumption may be the problem: the important structure could be curved, which PCA cannot capture. For that, reach for a nonlinear method — UMAP for visualising, or kernel PCA for preprocessing. A drop in performance after PCA is telling you something real about where your signal lives.`,
      `**Fit PCA inside the split, know whitening, and match the variant to the data.**\n\nPCA learns from data, so fit it (and the scaler) on the training fold only — inside a Pipeline within CV — or the components leak test information. Whitening rescales all components to unit variance (decorrelated and isotropic) but amplifies the low-variance noise directions, so use it only when the downstream model wants equal-variance inputs. For high-dimensional or sparse data (TF-IDF text), use randomized PCA or TruncatedSVD (works on sparse matrices without centering) rather than covariance PCA.`,
      `**Respect PCA's assumptions and reach for the right alternative.**\n\nPCA is linear, variance-based, and outlier-sensitive, and its components are linear mixtures whose loadings you can inspect but rarely explain to a stakeholder — so prefer feature selection when explainability matters. A 2D PC1-vs-PC2 plot is for rough structure and outlier spotting, not proof of separability or cluster quality (validate on the real task). For nonlinear structure use t-SNE/UMAP (visualisation) or kernel PCA / autoencoders (nonlinear compression).`,
    ],
    checkQuestions: [
      {
        q: `You run PCA on a dataset with 100 features. The first component captures 85% of variance and the second captures 8%. How do you decide how many components to keep for a downstream classifier?`,
        options: [
          `A) Always keep only the first component whenever it captures more than 80% of total variance — additional components just add noise`,
          `B) Keep components to reach 95% cumulative variance, cross-validate several counts, and test excluding component 1 as a confound`,
          `C) The 85% variance captured in one component alone means that a single component is sufficient for any downstream task at all`,
          `D) Keep all 100 components regardless — PCA is only ever used for visualization, never for feature selection before classifiers`,
        ],
        answer: `B`,
      },
      {
        q: `A colleague skips standardisation before PCA on a dataset with features including income (range 20k-500k dollars), age (18-80), and binary flags (0 or 1). What goes wrong?`,
        options: [
          `A) PCA will fail to converge entirely because the covariance matrix becomes fully singular whenever features sit on very different numeric scales`,
          `B) The binary flags will dominate all principal components simply because their values are bounded between 0 and 1 always`,
          `C) PCA is fully scale-invariant, and standardisation is only ever needed for distance-based algorithms such as k-means`,
          `D) Income dominates every component since its variance dwarfs age and flags — that information gets compressed into later discarded components`,
        ],
        answer: `D`,
      },
      {
        q: `You apply PCA to reduce 1,000-dimensional text embeddings to 50 dimensions before running k-means. Cluster quality is poor. What might PCA have discarded?`,
        options: [
          `A) PCA simply cannot be applied to text embeddings at all — use word2vec-style dimensionality reduction instead for this exact case`,
          `B) Nothing — PCA preserves 90%+ of variance, so cluster quality problems must instead be caused by k-means hyperparameters`,
          `C) PCA discards low-variance, cluster-discriminative signal — try UMAP or cluster directly with cosine distance in full space`,
          `D) PCA discarded the stop words that k-means specifically needs in order to separate the topics correctly from one another`,
        ],
        answer: `C`,
      },
      {
        q: `Two datasets have the same dimensions and PCA explained-variance ratios. Are they similar datasets? What would you additionally check?`,
        options: [
          `A) Yes — identical eigenvalue spectra alone always prove that the two datasets share the exact same underlying structure`,
          `B) No — check PCA loadings, PC1 vs PC2 scatterplots, reconstruction error, and feature-to-component correlations too`,
          `C) Compare only the first two components — if PC1 and PC2 loadings match closely, the datasets are structurally equivalent`,
          `D) Identical explained-variance ratios alone are sufficient to confirm similarity — no additional checks are ever needed`,
        ],
        answer: `B`,
      },
      {
        q: `You fit PCA on your entire dataset, then split into train/test and cross-validate a classifier on the PCA features. Your scores look great but production underperforms. Which two statements correctly explain the bug and the fix?`,
        options: [
          `A) PCA learned its components from the covariance of the whole dataset, including test rows — a genuine leak of held-out information`,
          `B) Fit PCA and the scaler on each fold training portion only, inside a scikit-learn Pipeline, so components never see test data`,
          `C) There is no error here — PCA is unsupervised, so fitting it on all the data before splitting cannot leak any information at all`,
          `D) The real problem is that PCA reduced too many dimensions; keeping more components would remove the train/production gap`,
        ],
        answer: [`A`, `B`],
      },
      {
        q: `You need to reduce 40,000-dimensional sparse TF-IDF text vectors to 300 dimensions. Why is standard covariance-based PCA a poor choice, and what fits better?`,
        options: [
          `A) Standard PCA is ideal here — sparse high-dimensional text is exactly what covariance PCA was designed for, so use it directly`,
          `B) Standard PCA mean-centers the data, destroying sparsity and blowing up memory; use TruncatedSVD or randomized SVD instead`,
          `C) PCA cannot handle more than 1,000 dimensions at all in any case, so the only real option is to hash the features down first`,
          `D) Neither works at all — text embeddings must be reduced with t-SNE, the only method that is valid for sparse data like this`,
        ],
        answer: `B`,
      },
    ],
    interactivePrompt: `Before you touch the controls: why does PCA fail to remove noise, and under what condition does high explained variance in the first component become a problem rather than an asset?`,
    takeaway: `PCA keeps the highest-variance directions — but the task-discriminative signal might live in a low-variance direction that PCA throws out, so explained variance ratio is not a reliable proxy for information preserved for downstream tasks.`,
    recap: [
      "**Finds directions of maximum spread** (principal components), orthogonal, ranked by explained variance.",
      "**Components = eigenvectors of covariance;** computed via SVD; best linear compression that exists.",
      "**Keeps variance, not signal:** batch effects preserved, low-variance signal deleted.",
      "**Standardise first, every time** — PCA chases variance, big-scale features dominate.",
      "**PCA leaks:** fit on the training fold only, inside a Pipeline within CV.",
      "**Whitening** rescales components to unit variance but amplifies low-variance noise.",
      "**Linear, variance-based, outlier-sensitive;** 2D plot is for hypotheses, not proof of separability.",
    ],
    interactiveId: 'pca_viz',
    figures: {
      pca_variance: `<svg viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:320px;font-family:var(--font-sans,sans-serif)">
  <!-- scatter points (elongated ellipse cloud) -->
  <g fill="var(--ink-hi)" opacity="0.7">
    <circle cx="160" cy="130" r="3"/>
    <circle cx="175" cy="118" r="3"/>
    <circle cx="190" cy="108" r="3"/>
    <circle cx="205" cy="98" r="3"/>
    <circle cx="220" cy="90" r="3"/>
    <circle cx="145" cy="142" r="3"/>
    <circle cx="130" cy="152" r="3"/>
    <circle cx="115" cy="162" r="3"/>
    <circle cx="100" cy="172" r="3"/>
    <circle cx="85" cy="182" r="3"/>
    <circle cx="168" cy="122" r="3"/>
    <circle cx="183" cy="114" r="3"/>
    <circle cx="198" cy="104" r="3"/>
    <circle cx="152" cy="136" r="3"/>
    <circle cx="137" cy="147" r="3"/>
    <circle cx="122" cy="158" r="3"/>
    <circle cx="107" cy="167" r="3"/>
    <circle cx="176" cy="126" r="3"/>
    <circle cx="142" cy="139" r="3"/>
    <circle cx="213" cy="95" r="3"/>
  </g>
  <!-- centroid -->
  <circle cx="160" cy="130" r="4" fill="var(--ink-low)" opacity="0.8"/>
  <!-- PC1 arrow (major axis, ~-40 degrees) -->
  <line x1="160" y1="130" x2="240" y2="78" stroke="var(--prime)" stroke-width="2.5" marker-end="url(#arrowP)"/>
  <text x="248" y="74" fill="var(--prime)" font-size="10" font-weight="700">PC1</text>
  <text x="248" y="85" fill="var(--prime)" font-size="9">(max var)</text>
  <!-- PC2 arrow (minor axis, ~50 degrees) -->
  <line x1="160" y1="130" x2="190" y2="90" stroke="var(--ink-mid)" stroke-width="1.5" marker-end="url(#arrowM)"/>
  <text x="194" y="88" fill="var(--ink-mid)" font-size="9">PC2</text>
  <!-- projection dotted lines for a few points onto PC1 -->
  <line x1="220" y1="90" x2="214" y2="97" stroke="var(--ink-low)" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.7"/>
  <line x1="205" y1="98" x2="200" y2="104" stroke="var(--ink-low)" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.7"/>
  <line x1="100" y1="172" x2="104" y2="167" stroke="var(--ink-low)" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.7"/>
  <!-- projection points on PC1 line -->
  <circle cx="214" cy="97" r="2.5" fill="var(--prime)" opacity="0.7"/>
  <circle cx="200" cy="104" r="2.5" fill="var(--prime)" opacity="0.7"/>
  <circle cx="104" cy="167" r="2.5" fill="var(--prime)" opacity="0.7"/>
  <!-- arrowhead markers -->
  <defs>
    <marker id="arrowP" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="var(--prime)"/>
    </marker>
    <marker id="arrowM" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="var(--ink-mid)"/>
    </marker>
  </defs>
  <!-- title -->
  <text x="160" y="20" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">PCA: eigenvectors point to max variance</text>
</svg>`,
    },
  },
  {
    id: 'tsne_umap',
    title: 't-SNE & UMAP',
    subtitle: 'Perplexity, why t-SNE clusters mislead, UMAP vs t-SNE tradeoffs',
    difficulty: 'advanced',
    estimatedMin: 40,
    tags: ['t-SNE', 'UMAP', 'visualisation', 'manifold'],
    summary: `You have 50,000 single-cell RNA sequences, each described by 20,000 gene expression values. You want a 2D visualization to see whether cell types cluster naturally. PCA gives a blurry projection where all cells overlap. t-SNE produces a crisp 2D visualization where distinct cell types form separated islands — and that visualization guided the discovery of a previously unknown rare cell population, 0.1% of cells with a distinct gene expression profile invisible in PCA.

t-SNE: computes pairwise similarities in high dimensions (Gaussian distribution of distances, perplexity parameter controls effective neighborhood size). Computes pairwise similarities in low dimensions (Student t-distribution — heavier tails prevent crowding). Minimizes KL divergence between the two similarity distributions via gradient descent. The heavy tails in low dimensions mean that moderate distances in high dimensions map to large distances in low dimensions — this creates the well-separated clusters that make t-SNE visualizations visually striking.

UMAP (Uniform Manifold Approximation and Projection): grounded in Riemannian geometry and topological data analysis. Preserves more global structure than t-SNE, faster (O(n log n) vs O(n²)), supports out-of-sample transformation (new points can be projected without refitting). Default choice over t-SNE for most use cases.

[FIGURE: distance_distortion]

NOT-this: "t-SNE cluster distances are interpretable." The distances between clusters in a t-SNE plot are meaningless — a cell type that appears far from another in t-SNE might be close in the actual high-dimensional space. t-SNE preserves local neighborhoods but distorts global distances. Never interpret inter-cluster distances in a t-SNE plot. UMAP preserves more global structure but still warps distances.`,
    keyPoints: [
      `**Use UMAP over t-SNE for nearly all visualization tasks — it is faster, supports out-of-sample projection, and preserves more global structure while producing equally clear local cluster separation.**\n\nThe only reason to use t-SNE over UMAP is when existing analyses were done with t-SNE for direct comparison. For new work, UMAP is the default.`,
      `**Trap: interpreting cluster sizes in t-SNE or UMAP as meaningful.**\n\nPoint density in the 2D projection does not correspond to point density in the original space — a small dense cluster in the plot might represent a small or large group in high dimensions. Report cluster sizes from the original space, not the projection. Visual size carries no quantitative meaning.`,
      `**Diagnostic: if UMAP shows one undifferentiated blob, try increasing n_neighbors (too small → disconnected graph, no global structure) or decreasing min_dist (too large → all points crowded to center).**\n\nIf UMAP shows many tiny isolated clusters, n_neighbors is too small. Structures that persist across multiple n_neighbors values are more trustworthy than those that appear only at one setting.`,
    ],
    checkQuestions: [
      {
        q: `You run t-SNE with perplexity=5 and see 50 tiny, tight clusters. You run with perplexity=100 and see 3 blobs. Which two of the following are correct ways to figure out the "true" structure?`,
        options: [
          `A) Run at several intermediate perplexities (15, 30, 50) and compare against a UMAP embedding of the same dataset`,
          `B) Cluster in the original high-dimensional space with k-means and check which structures persist across perplexities`,
          `C) Perplexity=5 is always more accurate, since lower perplexity reveals true local structure that high perplexity obscures`,
          `D) Perplexity=100 is always more accurate, since t-SNE requires high perplexity to capture meaningful global structure`,
        ],
        answer: [`A`, `B`],
      },
      {
        q: `A team visualises 50,000 single-cell RNA-seq measurements with t-SNE, sees 12 distinct clusters, and runs k-means on the 2D t-SNE embedding. Explain two problems with this approach.`,
        options: [
          `A) t-SNE is far too slow for 50,000 cells to process, and k-means simply cannot handle raw RNA-seq data directly at all`,
          `B) The number of clusters should be set by BIC, not visual inspection; and k-means should use cosine distance for RNA-seq data`,
          `C) k-means on t-SNE uses distorted distances, wrong boundaries; the 12 clusters may be perplexity-dependent artefacts here`,
          `D) t-SNE does not work on high-dimensional data at all — PCA must be applied first, then k-means on the 2D output is valid`,
        ],
        answer: `C`,
      },
      {
        q: `Your t-SNE plot shows two large clusters that are completely separated. Does this mean these two groups are very different from each other in the original space?`,
        options: [
          `A) Yes — complete visual separation in a t-SNE plot always directly corresponds to large distance in the original high-D space`,
          `B) Yes — the heavy-tailed t-distribution t-SNE uses in low dimensions preserves inter-cluster distances proportionally too`,
          `C) No — t-SNE repulsive forces push separated groups apart regardless of true distance; verify with centroid distance or UMAP`,
          `D) Only if the exact same separation appears consistently at both low and high perplexity settings across multiple runs`,
        ],
        answer: `C`,
      },
      {
        q: `You need to compress 768-dimensional BERT embeddings to 2D for visualisation and downstream k-means clustering. What is your pipeline and why?`,
        options: [
          `A) Apply UMAP directly from 768D to 2D, then run k-means on the 2D output — UMAP preserves distances well enough for clustering here`,
          `B) Apply t-SNE for visualisation and k-means simultaneously — t-SNE is preferred since it handles dense manifold structure better`,
          `C) Apply PCA to 50D and cluster there, then apply UMAP to 2D separately for display only, colouring by the k-means labels`,
          `D) Run k-means directly in 768D — dimensionality reduction before clustering discards information and reduces clustering accuracy`,
        ],
        answer: `C`,
      },
    ],
    interactivePrompt: `Before you touch the controls: why is it wrong to run K-means on t-SNE output, and what is the correct workflow if you want both a 2D visualization and cluster labels?`,
    takeaway: `t-SNE and UMAP are for looking at data, not for generating features — inter-cluster distances in t-SNE are deliberately distorted, UMAP's are approximate, and clustering on either's 2D output will mislead you at exactly the boundaries that matter most.`,
    recap: [
      "**For looking, not for features** — 2D visualization of nonlinear structure.",
      "**t-SNE:** match high-D and low-D similarities, minimize KL; Student-t tails prevent crowding.",
      "**Inter-cluster distances are meaningless** — deliberately distorted; never interpret them.",
      "**UMAP default over t-SNE:** faster ($O(n\\log n)$), preserves more global structure, out-of-sample transform.",
      "**Cluster sizes in the plot carry no quantitative meaning** — report from original space.",
      "**Never run K-means on the 2D output** — cluster on PCA-50, use UMAP for display only.",
      "**Perplexity / n_neighbors are knobs:** trust structure that persists across settings.",
    ],
    interactiveId: 'tsne_viz',
    figures: {
      distance_distortion: `<svg viewBox="0 0 360 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">inter-cluster distance is not preserved</text>
  <!-- left: high-D (schematic) -->
  <text x="88" y="38" text-anchor="middle" fill="var(--ink-low)" font-size="9" font-weight="700">high-D space</text>
  <rect x="24" y="46" width="128" height="130" rx="4" fill="none" stroke="var(--rim)" stroke-width="1"/>
  <!-- A and B genuinely close; C far -->
  <g fill="var(--prime)" opacity="0.85"><circle cx="55" cy="90" r="3"/><circle cx="66" cy="82" r="3"/><circle cx="60" cy="100" r="3"/></g>
  <g fill="var(--amber)" opacity="0.85"><circle cx="92" cy="96" r="3"/><circle cx="100" cy="88" r="3"/><circle cx="95" cy="106" r="3"/></g>
  <g fill="var(--ink-mid)" opacity="0.85"><circle cx="120" cy="150" r="3"/><circle cx="130" cy="158" r="3"/><circle cx="124" cy="164" r="3"/></g>
  <text x="60" y="76" fill="var(--prime)" font-size="8" font-weight="700">A</text>
  <text x="97" y="80" fill="var(--amber)" font-size="8" font-weight="700">B</text>
  <text x="127" y="146" fill="var(--ink-mid)" font-size="8" font-weight="700">C</text>
  <line x1="63" y1="94" x2="96" y2="98" stroke="var(--ink-low)" stroke-width="0.9" stroke-dasharray="2,2"/>
  <text x="70" y="118" fill="var(--ink-low)" font-size="7">A–B close</text>
  <line x1="98" y1="106" x2="125" y2="150" stroke="var(--ink-low)" stroke-width="0.9" stroke-dasharray="2,2"/>
  <text x="120" y="128" fill="var(--ink-low)" font-size="7">B–C far</text>
  <!-- arrow -->
  <text x="180" y="112" text-anchor="middle" fill="var(--ink-low)" font-size="16">→</text>
  <text x="180" y="128" text-anchor="middle" fill="var(--ink-low)" font-size="7">t-SNE</text>
  <!-- right: 2D t-SNE (distorted) -->
  <text x="272" y="38" text-anchor="middle" fill="var(--ink-low)" font-size="9" font-weight="700">2D t-SNE plot</text>
  <rect x="208" y="46" width="128" height="130" rx="4" fill="none" stroke="var(--rim)" stroke-width="1"/>
  <!-- all three pushed to well-separated islands, gaps look equal -->
  <g fill="var(--prime)" opacity="0.85"><circle cx="232" cy="80" r="3"/><circle cx="242" cy="72" r="3"/><circle cx="236" cy="90" r="3"/></g>
  <g fill="var(--amber)" opacity="0.85"><circle cx="300" cy="78" r="3"/><circle cx="310" cy="70" r="3"/><circle cx="304" cy="88" r="3"/></g>
  <g fill="var(--ink-mid)" opacity="0.85"><circle cx="266" cy="150" r="3"/><circle cx="276" cy="158" r="3"/><circle cx="270" cy="164" r="3"/></g>
  <text x="236" y="66" fill="var(--prime)" font-size="8" font-weight="700">A</text>
  <text x="305" y="64" fill="var(--amber)" font-size="8" font-weight="700">B</text>
  <text x="272" y="146" fill="var(--ink-mid)" font-size="8" font-weight="700">C</text>
  <text x="272" y="195" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">gaps look equal — but A–B were close, B–C far</text>
</svg>`,
    },
  },
  {
    id: 'autoencoders_dim_reduction',
    interactiveId: 'vae_viz',
    interactivePrompt: 'An autoencoder squeezes data through a bottleneck and reconstructs it — explore the encoder → latent → decoder path and how the bottleneck forces a compressed representation.',
    title: 'Autoencoders for Dimensionality Reduction',
    subtitle: 'Encoder-decoder mechanics, bottleneck, VAE, anomaly detection via reconstruction error',
    difficulty: 'advanced',
    estimatedMin: 38,
    tags: ['autoencoder', 'VAE', 'dimensionality reduction', 'anomaly detection'],
    summary: `Think about describing a friend's face to a sketch artist. You cannot list every pixel — you compress it into a handful of essentials ("round face, thick eyebrows, crooked smile"), and from those few words the artist rebuilds something recognisable. An **autoencoder** is a neural network that learns to do exactly this on its own: squeeze data through a narrow middle, then rebuild it from the squeezed version.

Take 28×28 MNIST digit images — that is 784 numbers each. An autoencoder has two halves. The **encoder** funnels those 784 numbers down through shrinking layers (784 → 256 → 64 → 32) into a tiny 32-number **code**. The **decoder** takes those 32 numbers and expands them back out (32 → 64 → 256 → 784), trying to reproduce the original image. You train the whole thing on a single goal: make the rebuilt image match the original as closely as possible.

[FIGURE: autoencoder]

The magic is in the squeeze. Because everything has to pass through that 32-number **bottleneck**, the network cannot just copy the input across — it is forced to keep only what matters for rebuilding, and throw the rest away. Those 32 numbers become a compact summary of the digit. And unlike PCA, which can only compress along straight lines, an autoencoder is a neural net, so it can learn *curved* structure — which is why its codes separate MNIST digits far better than PCA's do.

---

**Three flavours worth knowing.**

A **denoising autoencoder** makes the job harder on purpose: it feeds in a *corrupted* input (add noise, or blank out some pixels) and asks the network to reconstruct the *clean* original. To pull that off, the encoder has to learn the real underlying structure rather than memorise surface detail — which makes it a popular way to pre-train representations when you have lots of unlabelled data.

A **variational autoencoder (VAE)** changes what the encoder outputs. Instead of one fixed code per input, it encodes to a little *cloud* of possible codes (a distribution), and adds a term to the loss that keeps those clouds tidy and continuous. That continuity is what makes a VAE *generative*: you can sample a fresh point from the latent space and the decoder turns it into a brand-new, plausible image. A plain autoencoder cannot do this — sample a random point from its latent space and you usually get garbage, because it never learned to fill the gaps between training examples. That is the key difference: VAEs are generative, plain autoencoders are not.

---

**A bonus use: catching anomalies.**

Here is a neat trick that falls out of the design. Train an autoencoder only on *normal* data — normal transactions, healthy sensor readings. It becomes very good at rebuilding normal things. Now feed it something weird: because it never learned to compress that pattern, the rebuild comes out badly and the **reconstruction error** spikes. So a high reconstruction error flags an anomaly, for free.

But it only works if the bottleneck is sized right, and this is the whole game. Too *narrow* and the network cannot even rebuild normal data well, so everything looks anomalous. Too *wide* and the network has enough room to memorise *everything* — including the weird stuff — so nothing looks anomalous. The bottleneck has to be tight enough to force real compression, yet loose enough to reconstruct genuine normal data. Get that balance wrong and the anomaly detector fails silently.

---

**The reconstruction loss must match the data.**

"Make the rebuild match the original" needs a *specific* loss, and the choice depends on the data. **MSE** (squared error) fits continuous real-valued data — sensor readings, standardised features. **Binary cross-entropy (BCE)** fits data in [0,1] like normalised pixel intensities or binary features. For images where pixel-perfect error misses perceptual quality, a **perceptual loss** (distance in a pretrained network's feature space) matches human judgement better. Use MSE on a [0,1] pixel target and it under-penalises blur; use BCE on unbounded sensor values and it's meaningless. Match the loss to the data type first.

---

**The reparameterisation trick, properly.**

The VAE encodes to a distribution and then *samples* a code z ~ N(μ, σ²) — but sampling is random, and you can't backpropagate gradients through a random draw. The **reparameterisation trick** rewrites the sample as **z = μ + σ·ε**, with ε ~ N(0,1) drawn *outside* the computation graph. Now the randomness sits in ε (a constant for that step), while μ and σ are ordinary differentiable outputs, so gradients flow back to the encoder. This one rewrite is what makes VAEs trainable by gradient descent — worth being able to state, not just recognise.

---

**The VAE loss, and where it breaks.**

A VAE's loss has **two terms**: a **reconstruction loss** (rebuild the input) plus a **KL-divergence** term that pulls each input's latent cloud toward a standard normal, keeping the latent space continuous and sampleable. The failure mode to name is **posterior collapse**: if the decoder is powerful enough to reconstruct without using the latent code, the KL term wins and the encoder outputs the prior for everything — the latent variables carry no information. **β-VAE** exposes a knob β on the KL term: β > 1 pushes toward more disentangled (but blurrier) codes, β < 1 toward sharper reconstruction with a messier latent space. Tuning β trades reconstruction against latent structure.

---

**Setting the anomaly threshold.**

A reconstruction-error detector is useless without a cutoff, and you don't get one for free. The standard approach: after training on normal data, compute the reconstruction-error distribution on a **held-out normal** set and set the threshold at a high **percentile** (say the 95th or 99th) — accepting that percentage as your expected false-positive rate. If you have even a few **labeled anomalies**, tune the threshold on the precision/recall trade-off they give you instead. Either way, the cutoff is a deliberate business choice about false-positive rate versus miss rate, not a default.

---

**The silent killer: contaminated training data.**

The whole method assumes training data is *pure normal*. If real anomalies hide in your "normal" training set, the autoencoder learns to reconstruct **them too** — so at inference they produce low error and slip through, and the detector fails without any warning. This is the most common reason a reconstruction detector misses known defects. Guard against it: clean the training set as best you can, or use robust training that down-weights high-error examples during training.

---

**Low error isn't proof of normal (and high error isn't proof of anomaly).**

Reconstruction error is a noisy signal in both directions. **Low** error can occur for a genuine anomaly the model happened to memorise, or one that's small relative to MSE dominated by other dimensions. **High** error can come from plain input noise, a scaling/preprocessing mismatch, a sensor dropout, or a rare-but-perfectly-valid sample — none of which are true anomalies. So treat reconstruction error as evidence to investigate, not a verdict, and always sanity-check flagged cases.

---

**Architecture choices.**

The encoder/decoder shape should match the data. **Dense** (fully-connected) autoencoders suit tabular data; **convolutional** autoencoders suit images (they respect spatial locality); **sequence** autoencoders (LSTM or Transformer encoder-decoder) suit time series and text. Beyond the **bottleneck size** (the main knob), you regularise with **dropout**, **weight decay**, or an explicit **sparsity penalty** on the code (a sparse autoencoder). Reaching for a dense AE on images, or an oversized bottleneck with no regularisation, is a common way to get a detector that quietly memorises everything.`,
    keyPoints: [
      `**A denoising autoencoder can pretrain representations when unlabeled data is abundant and labels are scarce — but it's not automatically the winner.**\n\nThe denoising objective forces more robust representations, and fine-tuning on the labeled subset *can* beat training from scratch when unlabeled data is plentiful — but "consistently outperforms" is too strong: modern contrastive/self-supervised methods (SimCLR-style, masked modeling) often produce better representations than a vanilla autoencoder. Treat AE pretraining as one option to benchmark, not a guaranteed win. The corruption level is a hyperparameter — start with 20–30% masking and tune on the labeled validation set.`,
      `**Trap: the reconstruction loss can be minimized by memorizing training examples rather than learning compact representations.**\n\nCheck that the latent space clusters by meaningful categories (not just by individual examples) using visualization before using the representations downstream. A latent space that looks like a random cloud when colored by class label has not learned useful structure.`,
      `**Diagnostic: if reconstruction loss is low but downstream task performance is poor, the autoencoder is encoding reconstruction-irrelevant information.**\n\nAdd a classification loss or explicit invariance (contrastive learning) to align the representation with the downstream task. Low reconstruction loss is a necessary but not sufficient condition for useful representations.`,
      `**Match the loss and architecture to the data, and know the VAE's two terms and its failure mode.**\n\nUse MSE for continuous data, BCE for [0,1] data, perceptual loss for image quality; use dense AEs for tabular, convolutional for images, sequence (LSTM/Transformer) for time series/text, and regularise with dropout, weight decay, or a sparsity penalty. A VAE's loss is reconstruction + KL-to-prior, trained via the reparameterisation trick z = μ + σ·ε; watch for posterior collapse (decoder ignores the code) and use β-VAE's β to trade disentanglement against reconstruction.`,
      `**For anomaly detection, set the threshold deliberately and distrust contaminated data and raw error.**\n\nSet the cutoff from the held-out normal error distribution (a high percentile = your false-positive budget), or tune on precision/recall if you have labeled anomalies. The method assumes pure-normal training data — real anomalies hiding in it get learned and reconstructed well, so they slip through silently; clean the data or down-weight high-error examples. And low error isn't proof of normal (memorised or MSE-swamped anomalies) nor is high error proof of anomaly (noise, scaling bugs, rare-but-valid samples) — investigate flagged cases, don't trust the score blindly.`,
    ],
    checkQuestions: [
      {
        q: `You train an autoencoder for anomaly detection and find that reconstruction error is high for both normal and anomalous samples. Which two of the following correctly diagnose this?`,
        options: [
          `A) High error on normal samples signals underfitting — bottleneck too small, model too shallow, or features not standardised`,
          `B) If error were also low for anomalies, that would separately indicate the bottleneck is too large and the model is memorising`,
          `C) The training data must be contaminated with anomalies, so simply retrain the model on a cleaner dataset from another source`,
          `D) Autoencoders always start out with high reconstruction error regardless of architecture; just wait for more training epochs`,
        ],
        answer: [`A`, `B`],
      },
      {
        q: `What is the reparameterisation trick in a VAE and why is it necessary?`,
        options: [
          `A) It replaces the KL divergence term entirely with a simpler L2 penalty, which is what makes the loss function differentiable`,
          `B) It is optional — modern autograd frameworks can already differentiate directly through any random sampling operation`,
          `C) It removes the need for a decoder entirely by sampling directly from the prior distribution at inference time instead`,
          `D) Sampling z~N(mu,sigma^2) is non-differentiable, so z=mu+sigma*eps with eps~N(0,1) makes gradients flow to the encoder`,
        ],
        answer: `D`,
      },
      {
        q: `An autoencoder trained on manufacturing sensor readings is being used for anomaly detection. A maintenance engineer reports that known defective sensors are not flagged. What could cause this and how do you debug?`,
        options: [
          `A) The bottleneck is definitely too small in this case — always increase bottleneck size whenever known anomalies are not flagged`,
          `B) Defects not flagged means their error is low — likely causes: training contamination, bottleneck too large, or MSE swamping`,
          `C) Autoencoders simply cannot detect sensor anomalies at all — use Isolation Forest instead for any manufacturing dataset`,
          `D) The model just needs more training epochs — defective patterns are only ever detected after training fully converges`,
        ],
        answer: `B`,
      },
      {
        q: `Compare using a VAE latent space versus using PCA components for anomaly detection. What are the trade-offs?`,
        options: [
          `A) PCA is always better for anomaly detection since it has a closed-form solution and never suffers from any training instability`,
          `B) VAE is always strictly better, since non-linear manifold structure is universal across essentially all real-world sensor data`,
          `C) PCA is fast, interpretable on Gaussian-linear data; VAE captures non-linear structure but needs care — pick by fit and data`,
          `D) They produce identical anomaly scores whenever the VAE bottleneck size matches the number of PCA components that were retained`,
        ],
        answer: `C`,
      },
      {
        q: `Your reconstruction-error anomaly detector was trained on a "normal" dataset, but a small fraction of those training samples were actually undetected anomalies. How does this hurt the detector, and what's the fix?`,
        options: [
          `A) It does not hurt at all — a few anomalies in training simply average out and have zero effect on the learned normal manifold`,
          `B) The model learns to reconstruct contaminants too, so they later produce low error and slip through — clean the data first`,
          `C) Contamination makes error high for everything, so the detector flags all samples as anomalies; the fix is a larger bottleneck`,
          `D) It only ever affects the KL term in a VAE, so switching to a plain autoencoder removes the entire problem completely`,
        ],
        answer: `B`,
      },
      {
        q: `You're building a VAE for anomaly detection on multivariate time-series sensor data. What reconstruction loss and encoder/decoder architecture fit best, and what VAE-specific failure should you watch for?`,
        options: [
          `A) Use binary cross-entropy with a dense fully-connected autoencoder, and do not worry about VAE-specific issues since VAEs always train cleanly`,
          `B) Use MSE with a sequence architecture (LSTM or Transformer) that respects temporal order, and watch for posterior collapse via the beta knob`,
          `C) Use a convolutional autoencoder with perceptual loss, since sensor time series are essentially images, and posterior collapse cannot happen here`,
          `D) Any loss and architecture work identically for time series data, and the only real concern is making the bottleneck as small as possible`,
        ],
        answer: `B`,
      },
    ],
    interactivePrompt: `Before you touch the controls: if you make the bottleneck too large, what happens to the autoencoder's ability to flag anomalies, and why?`,
    takeaway: `Autoencoders compress input through a bottleneck and flag anything the decoder cannot reconstruct well — but only if the bottleneck is sized right: too wide and the model memorizes everything including anomalies, too narrow and normal samples also fail to reconstruct.`,
    recap: [
      "**Encoder squeezes to a bottleneck, decoder rebuilds;** trained to minimize reconstruction error.",
      "**Bottleneck forces keeping only what matters** — nonlinear compression, beats PCA on curved structure.",
      "**Denoising AE:** reconstruct clean from corrupted input → learns real structure.",
      "**VAE is generative:** encodes to a distribution + KL term; sample new points; plain AE cannot.",
      "**Reparameterisation trick:** $z=\\mu+\\sigma\\cdot\\varepsilon$ makes sampling differentiable; posterior collapse is the failure mode.",
      "**Anomaly detection via reconstruction error** — bottleneck sizing is the whole game (too wide memorizes, too narrow rejects normal).",
      "**Match loss to data:** MSE continuous, BCE [0,1], perceptual for images; contaminated \"normal\" training fails silently.",
    ],
    figures: {
      autoencoder: `<svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:400px;font-family:var(--font-sans,sans-serif)">
  <!-- input -->
  <rect x="34" y="35" width="20" height="120" rx="3" fill="var(--ink-hi)" opacity="0.35"/>
  <text x="44" y="172" text-anchor="middle" fill="var(--ink-low)" font-size="9">input 784</text>
  <!-- encoder trapezoid -->
  <polygon points="60,35 60,155 188,110 188,80" fill="var(--prime)" opacity="0.18" stroke="var(--prime)" stroke-width="1"/>
  <text x="118" y="30" text-anchor="middle" fill="var(--prime)" font-size="10" font-weight="700">encoder</text>
  <!-- bottleneck -->
  <rect x="190" y="80" width="20" height="30" rx="3" fill="var(--amber)" opacity="0.85"/>
  <text x="200" y="128" text-anchor="middle" fill="var(--amber)" font-size="9" font-weight="700">code 32</text>
  <!-- decoder trapezoid -->
  <polygon points="212,80 212,110 340,155 340,35" fill="var(--prime)" opacity="0.18" stroke="var(--prime)" stroke-width="1"/>
  <text x="282" y="30" text-anchor="middle" fill="var(--prime)" font-size="10" font-weight="700">decoder</text>
  <!-- output -->
  <rect x="346" y="35" width="20" height="120" rx="3" fill="var(--ink-hi)" opacity="0.35"/>
  <text x="356" y="172" text-anchor="middle" fill="var(--ink-low)" font-size="9">rebuild 784</text>
  <text x="200" y="150" text-anchor="middle" fill="var(--ink-low)" font-size="9">squeeze through the middle, then rebuild</text>
</svg>`,
    },
  },
  {
    id: 'gmm',
    interactiveId: 'gmm_viz',
    title: 'Gaussian Mixture Models',
    subtitle: 'EM algorithm, soft assignments, model selection with BIC',
    difficulty: 'advanced',
    estimatedMin: 38,
    tags: ['GMM', 'EM algorithm', 'probabilistic clustering', 'soft assignment'],
    summary: `You have per-transaction purchase amounts x. Some transactions are 5 dollars (app purchases), some are 50 dollars (subscriptions), some are 500 dollars (enterprise). The distribution of purchase amounts is trimodal — three distinct subpopulations. K-means would split them by which of 3 centroids is nearest. But a single $26 transaction sits between the $5 and $50 clusters — does it belong to the 5-dollar cluster or the 50-dollar cluster? GMM computes a responsibility for each component, worked out below.

Gaussian Mixture Model: P(x) = Σₖ πₖ N(x | μₖ, Σₖ) where πₖ is the mixing weight (Σπₖ = 1), N(x | μₖ, Σₖ) is the k-th Gaussian component evaluated at a single scalar transaction amount x — not an aggregate over a customer's several purchases. Responsibility for component k at a point x is r_k(x) = πₖN(x|μₖ,Σₖ) / Σⱼ πⱼN(x|μⱼ,Σⱼ). Worked example: take the $5 cluster as (π=0.45, μ=5, σ=8) and the $50 cluster as (π=0.35, μ=50, σ=12). At x=26: N(26|5,8)≈0.00159 and N(26|50,12)≈0.00450, so πₖN(x|μₖ,Σₖ) gives 0.45×0.00159≈0.00072 for the $5 cluster and 0.35×0.00450≈0.00157 for the $50 cluster. Normalizing those two — 0.00072/(0.00072+0.00157) and 0.00157/(0.00072+0.00157) — gives responsibilities of about 31% for the $5 cluster and 69% for the $50 cluster for that one $26 transaction. A customer with several transactions gets one responsibility vector per transaction, not a single blended number for the customer.

Fitted via EM, which alternates two steps until log-likelihood stops improving: the E-step computes every point's responsibility r_k(x) for every component using the formula above; the M-step then re-estimates πₖ, μₖ, Σₖ as the responsibility-weighted mixing fraction, mean, and covariance over all points. Each E/M pair provably does not decrease the log-likelihood, but the landscape is multimodal, so EM only hill-climbs to whichever local optimum is nearest its starting point.

[FIGURE: soft_assignment]

Covariance types control cluster shape: full (each component has a different Σₖ — arbitrary ellipsoids), tied (all components share one Σ), diag (Σₖ is diagonal — axis-aligned ellipsoids, fewer parameters), spherical (Σₖ = σₖ²I — each component is K-means-like). Full covariance is most expressive but requires the most parameters. Spherical alone is not enough to equal soft K-means — it also has to be tied (one shared σ² across every component, not a separate σₖ² per component); spherical-and-tied covariance is equivalent to soft K-means, and as σ→0 it reduces further to hard K-means's plain Euclidean nearest-centroid rule. Untied (per-component) spherical covariance still lets each cluster use its own scale, so it does not collapse to that rule.

Bayesian Information Criterion for model selection: BIC = k·log(n) - 2·log(L̂). Lower is better. Penalizes model complexity. Fit GMMs with K=1 to 20, plot BIC, take the minimum.

NOT-this: "GMM is just soft K-means." Soft K-means is GMM with spherical, tied covariance (one shared σ² across every component, not per-component σₖ²) and equal mixing weights. Full GMM with full covariance can fit elliptical clusters of any orientation and size — qualitatively different from K-means geometry. The covariance matrix is the key structural difference.`,
    keyPoints: [
      `**Use BIC to select the number of components — fit K=1 to 20, take the K with minimum BIC.**\n\nThis is more principled than the elbow method and penalizes overfitting. If BIC keeps decreasing past K=20, your data does not have well-defined Gaussian components — try HDBSCAN or examine whether a distributional assumption is appropriate at all.`,
      `**Trap: initializing GMM randomly on high-dimensional data leads to component collapse — a component gets assigned 0 weight and disappears.**\n\nUse K-means to initialize the component means before running EM. Sklearn's GaussianMixture does this by default with init_params=\`'kmeans'\`. Multiple restarts (n_init > 1) further reduce the risk of degenerate solutions.`,
      `**Diagnostic: plot the learned Gaussian components as ellipses over the data.**\n\nIf components heavily overlap (high uncertainty for all points), K is too large. If data points lie clearly between component centers with low probability under all components, K is too small. Soft assignment probabilities near 0.5 across all components for most points indicate that the Gaussian assumption may not match your data geometry.`,
    ],
    checkQuestions: [
      {
        q: `EM for GMM is guaranteed to not decrease log-likelihood at each step, yet it often converges to a poor local optimum. Which two of the following correctly explain this?`,
        options: [
          `A) The guarantee is about local monotonicity, not global optimality — the log-likelihood landscape is genuinely multimodal`,
          `B) EM hill-climbs to the nearest local maximum from its starting point, so run multiple restarts and keep the best result`,
          `C) The guarantee is actually incorrect — EM can decrease log-likelihood whenever covariance matrices become singular`,
          `D) Poor local optima only occur with diagonal covariance; switching to full covariance guarantees the global optimum always`,
        ],
        answer: [`A`, `B`],
      },
      {
        q: `You fit a GMM with K=5 and diagonal covariance on 10,000 points in 50 dimensions. BIC keeps decreasing as you increase K from 1 to 20. What does this suggest and what do you do?`,
        options: [
          `A) BIC always decreases monotonically with K in every case — the correct stopping rule is when AIC and BIC finally disagree`,
          `B) The data genuinely has more than 20 natural groups here — always keep increasing K until BIC itself starts increasing`,
          `C) Switch to full covariance instead — diagonal covariance is causing BIC to badly underestimate its penalty term here`,
          `D) True cluster count may exceed 20, or non-Gaussianity needs many parts — try PCA first, remove outliers, or use HDBSCAN`,
        ],
        answer: `D`,
      },
      {
        q: `A customer segmentation GMM has a component with mixture weight π_k = 0.001 that collapses to a tiny covariance (singular matrix). What happened and how do you fix it?`,
        options: [
          `A) This is normal, expected behaviour — components with small mixture weights always have small covariances by definition`,
          `B) The component latched onto a few isolated points and drove its covariance to zero — fix with regularisation or Bayesian GMM`,
          `C) Increase the number of EM iterations further — degenerate components always resolve themselves eventually with more training`,
          `D) Switch to full covariance — diagonal covariance always produces degenerate components whenever mixture weights are small`,
        ],
        answer: `B`,
      },
      {
        q: `How do you use GMM for density estimation and anomaly detection? What determines the anomaly threshold?`,
        options: [
          `A) GMM anomaly detection strictly requires labelled anomalies to set any threshold — it cannot ever operate fully unsupervised`,
          `B) Use the number of mixture components as the threshold — points in components with under 5% mixture weight are anomalies`,
          `C) Compute log p(x) per sample after fitting; flag very low log-likelihood; set threshold by percentile or labelled data`,
          `D) GMM density estimation only ever works for anomaly detection when K=1 — multiple components make the threshold ambiguous`,
        ],
        answer: `C`,
      },
    ],
    interactivePrompt: `Before you touch the controls: what is the difference between a hard cluster assignment in K-means and a soft assignment in GMM, and when does the difference matter operationally?`,
    takeaway: `GMM lifts three K-means restrictions at once — soft assignments, elliptical clusters, log-likelihood as the fit criterion — but EM only finds a local optimum, so run multiple restarts and use BIC to choose K.`,
    recap: [
      "**Soft probabilistic assignment:** $P(x)=\\Sigma\\pi_k\\,N(x|\\mu_k,\\Sigma_k)$, fitted by EM.",
      "**Lifts three K-means limits:** soft membership, elliptical clusters, log-likelihood as fit criterion.",
      "**EM alternates E-step and M-step:** E-step computes each point's responsibility $r_k(x)=\\pi_k N(x|\\mu_k,\\Sigma_k)/\\Sigma_j\\pi_j N(x|\\mu_j,\\Sigma_j)$ per component; M-step re-estimates $\\pi_k,\\mu_k,\\Sigma_k$ as the responsibility-weighted mixing fraction/mean/covariance.",
      "**Covariance type controls shape:** full (any ellipsoid), tied, diag, spherical (spherical + tied = soft K-means).",
      "**EM only finds a local optimum** — use multiple restarts.",
      "**Select K by BIC** ($k\\log n - 2\\log\\hat{L}$, lower better), fit K=1–20, take the minimum.",
      "**Init means with K-means** to avoid component collapse (sklearn default).",
      "**Overlapping ellipses = K too large;** points between centers = K too small.",
    ],
    interactiveId: 'gmm_viz',
    figures: {
      soft_assignment: `<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">GMM gives a probability, not a hard label</text>
  <!-- component 1 ellipse -->
  <ellipse cx="105" cy="110" rx="58" ry="34" fill="var(--prime)" opacity="0.10" stroke="var(--prime)" stroke-width="1"/>
  <ellipse cx="105" cy="110" rx="34" ry="20" fill="var(--prime)" opacity="0.12" stroke="var(--prime)" stroke-width="0.8"/>
  <circle cx="105" cy="110" r="3" fill="var(--prime)"/>
  <text x="105" y="60" text-anchor="middle" fill="var(--prime)" font-size="9" font-weight="700">$50 cluster</text>
  <!-- component 2 ellipse -->
  <ellipse cx="255" cy="110" rx="52" ry="30" fill="var(--amber)" opacity="0.12" stroke="var(--amber)" stroke-width="1"/>
  <ellipse cx="255" cy="110" rx="30" ry="17" fill="var(--amber)" opacity="0.14" stroke="var(--amber)" stroke-width="0.8"/>
  <circle cx="255" cy="110" r="3" fill="var(--amber)"/>
  <text x="255" y="64" text-anchor="middle" fill="var(--amber)" font-size="9" font-weight="700">$5 cluster</text>
  <!-- the ambiguous point sitting between -->
  <circle cx="172" cy="110" r="6" fill="none" stroke="var(--ink-hi)" stroke-width="2"/>
  <circle cx="172" cy="110" r="2" fill="var(--ink-hi)"/>
  <!-- membership lines -->
  <line x1="166" y1="110" x2="112" y2="110" stroke="var(--prime)" stroke-width="1.4" stroke-dasharray="4,2"/>
  <line x1="178" y1="110" x2="248" y2="110" stroke="var(--amber)" stroke-width="1.4" stroke-dasharray="4,2"/>
  <text x="172" y="95" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">this $26 purchase</text>
  <!-- probability bars -->
  <text x="180" y="160" text-anchor="middle" fill="var(--ink-low)" font-size="8">soft assignment</text>
  <rect x="70" y="168" width="150" height="16" rx="3" fill="var(--prime)" opacity="0.8"/>
  <rect x="220" y="168" width="70" height="16" rx="3" fill="var(--amber)" opacity="0.85"/>
  <text x="145" y="180" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">69% $50</text>
  <text x="255" y="180" text-anchor="middle" fill="#000" font-size="9" font-weight="700">31% $5</text>
</svg>`,
    },
  },
  {
    id: 'anomaly_detection',
    interactiveId: 'anomaly_detection_viz',
    title: 'Anomaly Detection',
    subtitle: 'Isolation Forest, one-class SVM, LOF, autoencoder-based, evaluation without labels',
    difficulty: 'intermediate',
    estimatedMin: 40,
    tags: ['anomaly detection', 'isolation forest', 'outlier', 'one-class'],
    summary: `Every day your e-commerce site processes a flood of transactions. **99.9%** are ordinary. **0.1%** are fraud — and the tricky part is that the newest fraud looks like nothing anyone has labelled before. You cannot just train a fraud classifier, because you have almost no fraud examples and the next attack will be one you have never seen. So you flip the problem: instead of learning what fraud looks like, learn what *normal* looks like, and flag anything that does not fit. That is **anomaly detection**.

There are a few different ways to define "does not fit," and each one is a different algorithm.

---

**Statistical: live in the fat part of the distribution.**

Fit a distribution to your normal data (a bell curve, say) and flag any point that lands far out in the thin tail. Simple, and great when "normal" really does form a neat blob — but it struggles the moment normal has a lumpy, complicated shape.

---

**Isolation Forest: anomalies are easy to fence off.**

This one has a genuinely clever insight. Pick a feature at random, pick a random value to split on, and cut the data in two. Keep cutting. A *normal* point is buried in a dense crowd, so it takes many random cuts to fence it off by itself. An *anomaly* sits out on its own, so just a couple of cuts isolate it. So the anomaly score is simply *how few cuts it took to isolate this point* — fewer cuts, more anomalous.

[FIGURE: isolation]

It is fast (scales to millions of points), makes no assumption about the shape of normal, and is the sensible default for tabular data.

---

**Reconstruction and density: two more lenses.**

A **reconstruction** method (an autoencoder — the same architecture used for dimensionality reduction) learns to rebuild normal data, then flags anything it rebuilds badly. A **density** method like **LOF** (Local Outlier Factor) compares how crowded a point's neighbourhood is versus its neighbours' neighbourhoods — a point sitting in a sparse patch surrounded by dense ones stands out. The clever bit about LOF is that it judges density *locally*, so it can flag the odd point at the edge of a loose cluster without wrongly flagging an entire tight-but-small cluster.

---

**Turning a score into a decision (and checking it works).**

All of these produce a continuous *score*, not a yes/no. To act on it you pick a threshold — flag the top 1%, or flag as many as your review team can actually investigate, or tune it against whatever few labels you have. And do not fool yourself into thinking you need labelled anomalies to *train* — you do not, and that is the whole point. But grab even a tiny labelled set to *check* the detector: if the precision at your threshold is not at least 2× the base rate, the method is barely beating random and you should try another. A common practical check is Precision@50 — have an expert eyeball the top 50 flagged items and count how many are real.

---

**One-class SVM: draw a boundary around normal.**

The method in the title deserves its own paragraph. A **one-class SVM** learns a boundary (in a kernel-lifted space) that *tightly encircles* the normal data; anything falling outside is an anomaly. With an RBF kernel it can wrap a **nonlinear** normal region, which makes it a good fit for **small-to-medium, clean** datasets where normal has a complex shape. The costs: it's very **sensitive to scaling and to its hyperparameters** — \`nu\` (roughly the expected fraction of outliers / margin softness) and \`gamma\` (kernel width) — and it **scales poorly** (roughly O(n²)–O(n³)), so it's the wrong tool for millions of points. Reach for it on modest, well-cleaned data; reach for Isolation Forest when volume or dimensionality is high.

---

**Novelty detection vs outlier detection.**

A distinction that trips people up. **Novelty detection** assumes your training data is *clean normal* and you want to flag *new, unseen* anomalies at inference (one-class SVM and autoencoders are natural here). **Outlier detection** assumes the training data is *already contaminated* with anomalies and you want to find them *within* it (Isolation Forest and LOF are typically used this way). The difference decides both which method fits and how you must treat the training set — a novelty method fed contaminated "normal" data learns the contaminants and misses them later.

---

**Time-series anomalies come in three kinds.**

Point-in-time methods miss a whole class of anomalies in sequences. **Point anomalies** are single wildly-off values (a sensor spikes to 1000). **Contextual anomalies** are values that are normal in general but abnormal *in context* (30°C is fine in summer, anomalous in December). **Collective / sequence anomalies** are a run of individually-normal values that together form an abnormal *pattern* (a heartbeat rhythm that's wrong as a shape). Isolation Forest and other per-point methods catch point anomalies but **miss contextual and collective ones** — those need sequence models (LSTM/Transformer autoencoders) that see the temporal context.

---

**Scaling matters — mostly.**

Feature scale changes what "far" means. **Distance-, kernel-, and reconstruction-based** methods (LOF, one-class SVM, autoencoders) are **scale-sensitive** — an unscaled large-range feature dominates the distance and drowns the others, so standardise first. **Isolation Forest** is *less* scale-sensitive (it splits on random thresholds per feature), but it's still affected by feature quality and irrelevant noise features. Standardising is the safe default across the board; it's only truly optional for tree-based isolation.

---

**The method-selection map.**

Match the tool to the situation. **Isolation Forest** — the scalable default for tabular data, no distributional assumption. **LOF** — when anomalies are *local* (sparse relative to a nearby dense cluster), but avoid it on very large datasets (O(n²)). **One-class SVM** — a clean, nonlinear boundary around normal on smaller data. **Autoencoders** — images, sequences, and nonlinear structure where reconstruction error is meaningful. Pick by data size, structure, and the *kind* of anomaly you expect.

---

**Evaluating without labels, expanded.**

Since you usually can't label anomalies, evaluation is a craft. **Synthetic anomaly injection** (add known-weird points and check they're caught) is useful but caveated — synthetic anomalies may not resemble real ones, so a detector that aces synthetic can still miss real fraud. **Precision@K expert audit** (have a human review the top-K flags) gives a real precision estimate. Track the **alert acceptance rate** (what fraction of alerts investigators confirm), the **incident-confirmation lag** (truth arrives weeks later), and set up **post-deployment label collection** so confirmed incidents become a labeled set for retraining. No single label-free metric is trustworthy alone — triangulate.

---

**The operational layer: alerts, not just scores.**

A production detector isn't a score, it's an alerting system, and that layer is where most of them fail. **Deduplicate** so one incident doesn't fire fifty alerts. Manage **alert fatigue** — too many false positives and investigators stop trusting the system, so a technically-good detector becomes useless. Add **severity scoring** and **investigation queues** so the worst cases surface first, wire a **false-positive feedback loop** back into tuning, and **monitor for drift** — "normal" shifts over time, so a detector calibrated last quarter silently degrades. The model produces scores; the operational layer decides whether anyone acts on them.`,
    keyPoints: [
      `**Use Isolation Forest as your default anomaly detector for tabular data — it is fast (O(n log n)), handles high dimensions, requires no distributional assumption, and its key tunable parameter is the contamination rate (expected fraction of anomalies) — though n_estimators (number of trees) and max_samples (subsample size per tree) are also commonly adjusted.**\n\nFor time-series data with contextual anomalies, switch to an LSTM or transformer autoencoder that reconstructs sequences — Isolation Forest treats each point independently and misses anomalies that only appear anomalous in context.`,
      `**Trap: using per-feature Z-scores to flag anomalies.**\n\nMultivariate anomalies — combinations that are individually normal but jointly unusual — are invisible to per-feature analysis. A transaction of 100 dollars at 3pm in New York is normal on each dimension; together they might be anomalous for a user who has never used the card outside California. Always use multivariate methods.`,
      `**Diagnostic: always test your anomaly detector on a small labeled holdout set, even if you cannot label everything.**\n\nIf precision at threshold is less than 2× the base rate, the method is barely better than random — try a different method or transform the feature space. Precision@50 (expert review of the top 50 flagged samples) is a practical operating metric when full labeled sets are unavailable.`,
      `**Know one-class SVM, the novelty/outlier split, and the time-series anomaly taxonomy.**\n\nOne-class SVM wraps a nonlinear boundary around clean normal data — good on small/medium sets, but scaling- and (nu, gamma)-sensitive and O(n²)–O(n³), so not for millions of points. Novelty detection assumes clean training data and flags new anomalies (one-class SVM, autoencoders); outlier detection assumes contaminated training data and finds anomalies within it (Isolation Forest, LOF). For time series, distinguish point, contextual (abnormal-in-context), and collective/sequence anomalies — per-point methods miss the latter two, which need sequence models. Standardise for distance/kernel/reconstruction methods (Isolation Forest is less scale-sensitive but still affected).`,
      `**Evaluate by triangulation and build the operational alerting layer.**\n\nWithout labels, combine synthetic anomaly injection (caveat: synthetics may not match real anomalies), Precision@K expert audits, alert acceptance rate, and post-deployment label collection for retraining — no single label-free metric is trustworthy alone. And a detector is an alerting system, not just a score: deduplicate alerts, manage alert fatigue (too many false positives and investigators stop trusting it), add severity scoring and investigation queues, feed false positives back into tuning, and monitor for drift since "normal" shifts over time.`,
    ],
    checkQuestions: [
      {
        q: `You are detecting network intrusion anomalies from 1 million log events per day with 200 features. Which method do you choose and why?`,
        options: [
          `A) LOF — it detects local density anomalies, which are consistently the most common pattern seen in network intrusion data`,
          `B) One-class SVM with RBF kernel — it learns a non-linear boundary around normal traffic that handles the high feature count well`,
          `C) Isolation Forest — O(n log n) training/scoring makes 1M events/day with 200 features feasible; better scaling than LOF or SVM`,
          `D) Mahalanobis distance on a fitted multivariate Gaussian — the most interpretable option for explaining intrusions to security teams`,
        ],
        answer: `C`,
      },
      {
        q: `LOF detects an anomaly in a dataset with two clusters of very different sizes and densities. A point in the smaller, denser cluster gets LOF=0.9 (classified as normal). A point at the edge of the larger, sparser cluster gets LOF=1.8 (classified as anomaly). Is this correct behaviour?`,
        options: [
          `A) No — the point in the dense small cluster should have high LOF, since the cluster is unusual relative to the global distribution`,
          `B) No — LOF should always be calibrated relative to global density across the dataset, not local neighbourhood density alone`,
          `C) No — LOF=0.9 indicates a genuine numerical error here, since LOF values can never fall below 1 for any point at all`,
          `D) Yes — LOF is locally normalised by design; dense-cluster point is normal locally (LOF≈1), sparse edge is not (LOF>1)`,
        ],
        answer: `D`,
      },
      {
        q: `Your Isolation Forest model is flagging 15% of transactions as anomalies, but the fraud team says the actual fraud rate is 0.5%. What do you change?`,
        options: [
          `A) Increase n_estimators from 100 to 500 trees — more trees in the ensemble reliably reduce the false positive rate here`,
          `B) Set contamination=0.005 to match the fraud rate; sweep 0.001-0.01, calibrate against labelled cases and capacity`,
          `C) Switch to LOF instead — Isolation Forest is known to have high false positive rates whenever the fraud rate is this low`,
          `D) Reduce max_samples per tree — smaller subsamples reduce over-sensitivity and thereby lower the false positive rate`,
        ],
        answer: `B`,
      },
      {
        q: `You have 1,000 labelled normal samples and 0 labelled anomalies. Which two of the following are correct ways to build and evaluate an anomaly detection model?`,
        options: [
          `A) Train Isolation Forest or an autoencoder exclusively on the normal samples, since no anomaly labels are needed to fit it`,
          `B) Evaluate via synthetic anomaly injection, expert review of top flagged samples, and collecting confirmed production incidents`,
          `C) You cannot build any anomaly detection model without labelled anomalies — go collect anomaly labels first before anything else`,
          `D) Use a one-class SVM and evaluate it by checking that its learned boundary tightly encircles every single training point`,
        ],
        answer: [`A`, `B`],
      },
      {
        q: `You must detect anomalies in ECG time series where a run of individually-normal beats forms an abnormal rhythm. Why might Isolation Forest miss this, and what fits better?`,
        options: [
          `A) Isolation Forest is ideal here — it isolates rare points quickly, and abnormal rhythms are always made of rare values`,
          `B) This is a collective/sequence anomaly: each beat is normal alone, so per-point methods miss it — use a sequence autoencoder`,
          `C) Isolation Forest misses it only because ECG data is high-dimensional; running PCA first would let it catch the rhythm easily`,
          `D) The rhythm is a contextual anomaly any scaling fix resolves, so just standardise features and Isolation Forest will catch it`,
        ],
        answer: `B`,
      },
      {
        q: `Your training data for a fraud detector is genuinely clean normal transactions, and you want to flag new, never-before-seen fraud at inference. Which framing and method family fit, versus finding anomalies hidden inside a contaminated dataset?`,
        options: [
          `A) Both are the same problem, so any anomaly method works identically regardless of whether training data is clean or contaminated`,
          `B) This is novelty detection (train clean, flag new); contaminated data fools it later — outlier detection differs, uses LOF`,
          `C) It is outlier detection, because all fraud detection is outlier detection — use LOF and assume the data is always contaminated`,
          `D) Neither framing applies to fraud at all; you must have labelled fraud examples and train a supervised classifier instead`,
        ],
        answer: `B`,
      },
    ],
    interactivePrompt: `Before you touch the controls: why does Isolation Forest give anomalies a shorter average path length, and what does that reveal about the assumption it is making about anomalies?`,
    takeaway: `Each anomaly detection algorithm encodes a different definition of "unusual" — Isolation Forest flags what is easy to isolate, LOF flags what is sparser than its neighbors, autoencoders flag what is hard to reconstruct — pick the definition that matches the anomalies you actually expect.`,
    recap: [
      "**Learn normal, flag what doesn't fit** — no fraud labels needed, catches unseen attacks.",
      "**Isolation Forest = scalable tabular default:** anomalies isolate in few random cuts, no distributional assumption.",
      "**LOF** flags locally sparse points; **autoencoder** flags what rebuilds badly; **one-class SVM** wraps a nonlinear boundary (small/clean data, $O(n^2)$–$O(n^3)$).",
      "**Per-feature Z-scores miss multivariate anomalies** — individually normal, jointly unusual.",
      "**Score → threshold is a business choice;** check Precision@K against base rate on a tiny labeled set.",
      "**Novelty (clean training) vs outlier (contaminated training)** decides method and data handling.",
      "**Time-series anomalies:** point, contextual, collective — per-point methods miss the last two; a detector is an alerting system, not a score.",
    ],
    interactiveId: 'anomaly_detection_viz',
    figures: {
      isolation: `<svg viewBox="0 0 400 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:400px;font-family:var(--font-sans,sans-serif)">
  <text x="100" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">normal point</text>
  <text x="300" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">anomaly</text>
  <rect x="20" y="28" width="160" height="120" rx="4" fill="none" stroke="var(--rim)" stroke-width="1"/>
  <rect x="220" y="28" width="160" height="120" rx="4" fill="none" stroke="var(--rim)" stroke-width="1"/>
  <!-- left: dense cluster, many cuts -->
  <g fill="var(--ink-low)" opacity="0.6">
    <circle cx="70" cy="70" r="3"/><circle cx="90" cy="60" r="3"/><circle cx="110" cy="72" r="3"/><circle cx="80" cy="90" r="3"/><circle cx="105" cy="95" r="3"/><circle cx="125" cy="82" r="3"/><circle cx="95" cy="110" r="3"/><circle cx="118" cy="108" r="3"/><circle cx="72" cy="105" r="3"/>
  </g>
  <g stroke="var(--prime)" stroke-width="1" opacity="0.8">
    <line x1="85" y1="28" x2="85" y2="148"/><line x1="120" y1="28" x2="120" y2="148"/><line x1="20" y1="78" x2="180" y2="78"/><line x1="20" y1="100" x2="180" y2="100"/>
  </g>
  <circle cx="100" cy="88" r="4.5" fill="var(--amber)"/>
  <text x="100" y="164" text-anchor="middle" fill="var(--ink-low)" font-size="9">many cuts to isolate</text>
  <!-- right: cluster + lone anomaly, 2 cuts -->
  <g fill="var(--ink-low)" opacity="0.6">
    <circle cx="260" cy="100" r="3"/><circle cx="278" cy="92" r="3"/><circle cx="295" cy="105" r="3"/><circle cx="270" cy="118" r="3"/><circle cx="290" cy="122" r="3"/><circle cx="255" cy="115" r="3"/>
  </g>
  <g stroke="var(--prime)" stroke-width="1" opacity="0.8">
    <line x1="330" y1="28" x2="330" y2="148"/><line x1="220" y1="55" x2="380" y2="55"/>
  </g>
  <circle cx="352" cy="42" r="4.5" fill="var(--amber)"/>
  <text x="300" y="164" text-anchor="middle" fill="var(--ink-low)" font-size="9">2 cuts to isolate</text>
</svg>`,
    },
  },
  {
    id: 'topic_modeling',
    title: 'Topic Modeling',
    subtitle: 'LDA mechanics, NMF, choosing K, coherence vs perplexity, production limits',
    difficulty: 'intermediate',
    estimatedMin: 38,
    tags: ['topic modeling', 'LDA', 'NMF', 'NLP'],
    summary: `You have 100,000 customer-support tickets and no time to read them. "App crashes at checkout," "payment keeps declining," "can't log in after the update," "no sound on video calls" — somewhere in that pile are a handful of recurring themes, and you want to find them *without* labelling every ticket by hand. **Topic modeling** does exactly this: it reads the whole corpus and discovers the hidden themes automatically, just from which words tend to show up together.

The core idea rests on one observation: words that belong to the same theme keep appearing together. "Payment," "declined," "card," and "refund" cluster in billing tickets; "crash," "freeze," "update," and "restart" cluster in bug reports. So a topic is really just *a group of words that travel together*, and a document is usually a *blend* of a few topics at once — a ticket might be 70% billing, 30% bug.

[FIGURE: topic_mixture]

---

**LDA: the classic recipe.**

**Latent Dirichlet Allocation (LDA)** is the workhorse. Its picture of the world: every topic is a bag of words with different weights (the "billing" topic leans heavily on "payment," "card," "declined"), and every document is a mixture of a few such topics. LDA starts from the finished documents and works *backwards* — given only the words it can actually see, it figures out what set of topics, and what per-document blend, most plausibly produced them. You tell it **K**, the number of topics to look for; it hands back the topics and each document's mix.

---

**The alternatives, and when they win.**

**NMF** (non-negative matrix factorization) factors the word-count table into "documents × topics" and "topics × words," keeping everything positive so the pieces add up rather than cancel out — it is faster than LDA and often better on short documents. **BERTopic** takes a more modern route: it turns each document into a meaning-based embedding (from a model like BERT), clusters those, and reads off each cluster's characteristic words. Because it works on *meaning* rather than raw word matches, it shines on short, messy text — it knows "crash" and "freeze" are related, where LDA just sees two unrelated words.

---

**The one hard choice: how many topics?**

There is no free lunch on picking K. Ask for too few topics and you get vague mega-themes that blur real distinctions; ask for too many and you get near-duplicate, hair-splitting topics nobody can act on. It is tempting to lean on **perplexity** (a statistical fit score), but that is a trap: perplexity almost always keeps "improving" as you add topics, so it will happily push you toward far too many. **Coherence** (do a topic's top words actually belong together?) is the better guide — it peaks at a sensible K and then falls as topics start to fragment. But no number settles it. The real test is human: can a domain expert put a clear one-word label on *every* topic without hedging? The right K is the largest one where that is still true.

(One practical note: LDA lives or dies on preprocessing. Strip out stop words and ultra-common terms first, or every topic ends up dominated by "the," "data," and "please," no matter how you tune it.)

---

**Inside LDA: the priors and how it's fit.**

LDA is a *generative* story with two knobs worth naming. Each document draws a **document-topic distribution** and each topic a **topic-word distribution**, both from **Dirichlet** priors controlled by **α** and **β**. **α** controls how many topics a document typically mixes: small α → each document is dominated by one or two topics; large α → documents spread across many. **β** controls topic sparsity in words: small β → each topic concentrated on a few words. Because you only observe the words, LDA *infers* the hidden distributions backward, using either **collapsed Gibbs sampling** (repeatedly reassign each word to a topic based on the current assignments of all others until it stabilises) or **variational inference** (optimise a tractable approximation to the true posterior). You don't need the math to use LDA, but knowing α/β and "it's Bayesian inference over hidden topic assignments" is standard interview fare.

---

**NMF, mechanically.**

NMF is the linear-algebra cousin. Take the document-term matrix **V** (usually TF-IDF weighted) and factor it into two non-negative matrices: **V ≈ W × H**, where **W** is documents×topics and **H** is topics×words. The **non-negativity** is the whole point — because nothing can subtract, topics combine *additively*, giving a **parts-based** representation (a document is a sum of topics, not a cancellation of them) that tends to be more interpretable. It's **faster and more stable than LDA and often better on short text**, where LDA's sparse word co-occurrence starves its statistics.

---

**BERTopic's fine print.**

BERTopic is powerful but has real knobs and caveats. It depends heavily on the **embedding model** you choose (and its language/domain — a general English model does poorly on medical or non-English text). Its **clustering step** (usually HDBSCAN) is sensitive to parameters and produces an explicit **outlier topic (-1)** for documents it can't cluster — which can swallow a large fraction of your corpus if tuned wrong. And because clustering is stochastic, **topics can shift between runs** (instability), so pin seeds and check reproducibility. It's often the best on short messy text — but "often," not "always."

---

**Choosing K, more fully.**

Coherence is the headline metric, but round it out. Plot the **coherence curve** over K and take a peak, then cross-check with **topic diversity** (are the top words across topics distinct, or do topics overlap?), the **duplicate-topic rate** (how many near-identical topics did you get?), and the **domain-labelability** test (can an expert name every topic?). The final filter is **business actionability** — a mathematically-fine K that produces topics nobody can *do anything with* is the wrong K. The best K is the largest one that's still coherent, diverse, and actionable.

---

**Evaluating topics beyond one number.**

Topic quality is multi-dimensional. **Topic coherence** (top words belong together) and **topic diversity** (topics don't repeat) are the automated pair. The **word-intruder task** is the human gold standard: insert one random word into a topic's top words and see if a person can spot it — if they can, the topic is coherent. Also weigh **downstream usefulness** (do the topics improve a task you care about?) and **stability** (do you get similar topics across different seeds and data samples?). A topic model that changes completely on a re-run isn't trustworthy no matter its coherence.

---

**In production, topics drift.**

Topic models aren't fit-once artifacts. Real corpora **drift** — new products, new slang, new issues appear, so a model trained last quarter slowly stops matching today's tickets. Plan a **retraining cadence**, and build **new-topic detection** (a rising share of outlier/-1 documents or a spike in low-coherence assignments signals an emerging theme). The topics also need **human naming** and a **taxonomy governance** process so labels stay consistent as the model is retrained, plus **monitoring of topic volume over time** (a topic suddenly surging is often the real business signal you wanted). The model finds themes; keeping them meaningful over months is an operational job.`,
    keyPoints: [
      `**Use BERTopic over LDA for short texts (tweets, support tickets, product reviews) — BERT embeddings capture synonymy and semantic relationships that word co-occurrence statistics miss.**\n\nLDA sees "crash" and "fail" as different words. BERTopic knows they are semantically related. For short texts where individual words carry insufficient co-occurrence signal, embedding-based methods dominate word-count-based methods.`,
      `**Trap: not preprocessing aggressively before LDA.**\n\nRemove stop words, apply stemming or lemmatization, remove words appearing in fewer than 5 or more than 80% of documents. LDA without preprocessing produces incoherent topics dominated by frequent function words regardless of K or the number of training iterations.`,
      `**Diagnostic: for each topic, look at the top 10 words and ask "can I give this topic a one-word label?"**\n\nIf you cannot, the topic is incoherent — reduce K or improve preprocessing. If all topics look similar (sharing words like "data," "result," "method"), add those high-frequency terms to the stop list and reduce K, because the model has carved one broad topic into near-duplicate components.`,
      `**Know LDA's priors and inference, NMF's factorisation, and BERTopic's caveats.**\n\nLDA draws document-topic and topic-word distributions from Dirichlet priors: α controls how many topics per document, β controls topic word-sparsity, and it's fit by collapsed Gibbs sampling or variational inference. NMF factors the (TF-IDF) matrix V ≈ W×H with non-negativity, giving a fast, stable, parts-based representation that often beats LDA on short text (sparse co-occurrence starves LDA). BERTopic depends on the embedding model and language/domain, produces an explicit outlier topic (-1) that can swallow the corpus if mis-tuned, and is unstable across runs — pin seeds.`,
      `**Pick K with multiple signals, evaluate topics multi-dimensionally, and plan for drift.**\n\nChoose K from the coherence curve plus topic diversity, duplicate-topic rate, expert labelability, and business actionability — perplexity keeps improving with K and misleads. Evaluate with coherence, diversity, the human word-intruder task, downstream usefulness, and stability across seeds/samples (a model that changes on re-run isn't trustworthy). In production, topics drift, so set a retraining cadence, build new-topic detection (rising outlier/-1 share), maintain human naming and taxonomy governance, and monitor topic volume over time — a surging topic is often the real signal.`,
    ],
    checkQuestions: [
      {
        q: `You train LDA with K=10 topics but the coherence score is low — words within each topic are not semantically related. Which two of the following are concrete, correct things to try?`,
        options: [
          `A) Improve preprocessing — add bigrams, extend the stop-word list, and raise the minimum document-frequency cutoff`,
          `B) Plot coherence versus K from 2 to 30 to find the actual peak, and switch to NMF with TF-IDF for short documents`,
          `C) Increase K to 20 outright — incoherence at K=10 always means the number of topics was simply set too low`,
          `D) Decrease the alpha hyperparameter to force sparser document-topic distributions, which always improves coherence`,
        ],
        answer: [`A`, `B`],
      },
      {
        q: `A document about "machine learning in healthcare" has LDA topic proportions: topic 3 (medicine) = 0.45, topic 7 (ML) = 0.40, topic 1 (other) = 0.15. How do you use this for document retrieval vs document categorisation?`,
        options: [
          `A) For both retrieval and categorisation, assign the document to its single highest-proportion topic and use the rest only for confidence`,
          `B) For retrieval, use the topic vector with cosine similarity; for categorisation, feed the soft vector to a classifier, not hard argmax`,
          `C) Soft topic proportions are only valid for retrieval when all proportions exceed 0.1; below that use hard assignment instead`,
          `D) LDA topic proportions cannot be used for retrieval at all — use TF-IDF cosine similarity and reserve LDA for categorisation only`,
        ],
        answer: `B`,
      },
      {
        q: `You find that the top 10 words for 3 out of 10 LDA topics are nearly identical (all contain "data", "model", "analysis", "result", "method"). What does this indicate?`,
        options: [
          `A) The three topics are genuinely capturing distinct sub-disciplines of methodology that just happen to share vocabulary here`,
          `B) K is set far too low in this case — always increase K so that each topic is free to specialise further beyond this point`,
          `C) The Dirichlet alpha hyperparameter is set too large here, which is directly causing topics to share too many words`,
          `D) Generic methodology words were not removed — add to stop list, reduce K since one topic split into near-duplicates`,
        ],
        answer: `D`,
      },
      {
        q: `What is the difference between perplexity and coherence as metrics for LDA? Why do they sometimes disagree about the optimal K?`,
        options: [
          `A) They measure exactly the same thing on different scales — any disagreement indicates a bug in the coherence calculation`,
          `B) Perplexity measures human interpretability and coherence measures statistical fit — use perplexity for production instead`,
          `C) Coherence is only valid when computed on the training corpus; using an external corpus like Wikipedia breaks the comparison`,
          `D) Perplexity is a fit metric that always improves with more topics; coherence peaks at moderate K, then degrades`,
        ],
        answer: `D`,
      },
      {
        q: `In LDA, you notice each support ticket is being modeled as a blend of many topics at once, making the per-document mixtures vague. Which hyperparameter controls this, and which way do you move it?`,
        options: [
          `A) Increase K instead — adding more topics automatically makes each individual document mixture sparser on its own`,
          `B) The document-topic prior alpha controls this: large alpha spreads documents thin, small concentrates — lower it here`,
          `C) Increase the number of Gibbs sampling iterations further — vague mixtures just mean the sampler has not converged yet`,
          `D) Switch from Gibbs sampling to variational inference instead, which is the only thing that controls per-document sparsity`,
        ],
        answer: `B`,
      },
      {
        q: `You run BERTopic on short product reviews and find 45% of documents assigned to topic -1, plus the topics change noticeably each time you re-run. What's happening and how do you address it?`,
        options: [
          `A) Topic -1 is actually your most important topic here, so just keep it and ignore run-to-run changes as pure random noise`,
          `B) Topic -1 is the HDBSCAN outlier bucket; 45% means clustering is too conservative or the embedding fits the domain poorly`,
          `C) 45% outliers means the reviews have no topics at all — switch to perplexity-optimised LDA, which never produces outliers`,
          `D) The instability proves BERTopic is fundamentally broken; only LDA gives reproducible topics, so abandon embeddings entirely`,
        ],
        answer: `B`,
      },
    ],
    interactivePrompt: `Before you touch the controls: why does perplexity keep improving as you add more topics, and why does that make it a poor criterion for choosing K?`,
    takeaway: `Statistical fit (perplexity) and human interpretability (coherence) optimize different objectives and disagree about the optimal K — the only test that matters is whether domain experts can assign a meaningful label to every topic without hedging.`,
    recap: [
      "**Topic = words that travel together;** document = a blend of a few topics.",
      "**LDA:** Dirichlet priors (α = topics per doc, β = word sparsity), inferred backward via Gibbs / variational inference.",
      "**NMF:** $V\\approx W\\times H$ non-negative, parts-based, faster and better on short text.",
      "**BERTopic:** embed → cluster → read off words; wins on short messy text but depends on embedding model, has -1 outlier topic, unstable across runs.",
      "**Perplexity misleads** (keeps improving with K); **coherence** peaks at a sensible K.",
      "**Real test:** can an expert one-word-label every topic? Preprocess aggressively — strip stop words.",
      "**Topics drift in production** — retraining cadence, new-topic detection, taxonomy governance.",
    ],
    figures: {
      topic_mixture: `<svg viewBox="0 0 380 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:380px;font-family:var(--font-sans,sans-serif)">
  <text x="190" y="20" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">one ticket = a blend of topics</text>
  <text x="30" y="52" fill="var(--ink-low)" font-size="9">ticket</text>
  <rect x="70" y="38" width="186" height="20" rx="3" fill="var(--prime)" opacity="0.8"/>
  <rect x="256" y="38" width="54" height="20" rx="3" fill="var(--amber)" opacity="0.85"/>
  <text x="163" y="52" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">billing 70%</text>
  <text x="283" y="52" text-anchor="middle" fill="#000" font-size="9" font-weight="700">bug 30%</text>
  <!-- topic word lists -->
  <rect x="40" y="86" width="14" height="14" rx="2" fill="var(--prime)" opacity="0.8"/>
  <text x="62" y="97" fill="var(--ink-hi)" font-size="10" font-weight="700">billing topic:</text>
  <text x="62" y="114" fill="var(--ink-low)" font-size="10">payment · card · declined · refund</text>
  <rect x="40" y="132" width="14" height="14" rx="2" fill="var(--amber)" opacity="0.85"/>
  <text x="62" y="143" fill="var(--ink-hi)" font-size="10" font-weight="700">bug topic:</text>
  <text x="62" y="160" fill="var(--ink-low)" font-size="10">crash · freeze · update · restart</text>
</svg>`,
    },
  },
]
