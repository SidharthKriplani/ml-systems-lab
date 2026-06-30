export const UNSUPERVISED_MODULES = [
  {
    id: 'clustering_overview',
    title: 'Clustering Taxonomy',
    subtitle: 'Partitional vs hierarchical vs density-based, no ground truth = no accuracy',
    difficulty: 'foundational',
    estimatedMin: 38,
    tags: ['clustering', 'taxonomy', 'unsupervised'],
    summary: `You have unlabeled data and want to know if there is structure in it — but no one has told you what "structure" means.

The algorithm you pick is your answer to that question, and different answers produce fundamentally incompatible results on the same data. K-means says structure means proximity to a centroid, so clusters are always round blobs. DBSCAN says structure means density connectivity, so clusters can be crescents or rings. Hierarchical methods refuse to commit: they record every possible merge and hand you a tree, letting you pick granularity after the fact. That flexibility is what makes clustering both powerful and dangerous: every method will always produce groups, but whether those groups reflect real signal or just the method's geometric assumptions is a question the math cannot answer. The only valid external check is whether someone can act on the clusters — whether a marketing team can write a campaign for each segment. Silhouette scores tell you about geometric quality; business validity is a separate, harder question.`,
    keyPoints: [
      `**Partitional clustering (k-means, k-medoids) forces n points into exactly k non-overlapping clusters, and you must commit to k before fitting — even when the true number of natural groups is unknown.** An incorrect k doesn't cause the algorithm to fail gracefully; it causes it to split real clusters apart or lump unrelated ones together, both confidently. Picking k=5 because it is a round number, not because the data has 5 natural groups, is how you get five plausible-looking but meaningless segments.`,
      `**Hierarchical clustering never asks you to pick k.** It builds a complete dendrogram — a binary tree recording every merge from n singletons to one giant cluster — and you cut the tree at a height threshold after the fact. One run gives every possible k simultaneously, which is the point. The price is O(n² log n) memory and time, making it unsuitable for n above ~10,000 without approximations.`,
      `**Density-based clustering (DBSCAN, HDBSCAN) defines clusters as dense regions connected by chains of nearby points, and explicitly labels sparse-region points as noise rather than force-assigning them to the nearest group.** This is the right choice when outliers would corrupt k-means centroids or when cluster shapes are non-convex. A single eps threshold fails when clusters have very different internal densities — that is exactly the problem HDBSCAN was built to fix by building a hierarchy across all eps values.`,
      `**Intrinsic evaluation metrics — silhouette score, Davies-Bouldin index, Calinski-Harabasz — measure geometric compactness and separation in Euclidean space, and every one of them is biased toward round, blob-shaped clusters.** A DBSCAN result that correctly recovers two crescent-shaped clusters can score low on silhouette because the metric has no concept of non-convex shape. A high silhouette on meaningless blobs is worse than a low silhouette on actionable segments.`,
      `**Extrinsic evaluation — Adjusted Rand Index, Normalised Mutual Information — compares predicted clusters to ground truth labels.** ARI=1 is perfect agreement; ARI=0 is no better than chance. These are the right tools for benchmarking algorithms against labelled test sets. In production, ground truth rarely exists, which is why extrinsic metrics stay in the lab and are never available for validating real clustering deployments.`,
      `**Business validity is a separate question from statistical quality, and it is the harder one.** A clustering is worth using when it is stable (similar structure on different seeds or subsets), interpretable (a domain expert can name each cluster without hedging), and actionable (cluster membership drives a different decision). Statistical metrics touch only the first criterion. Pipelines that optimise the metric but skip the other two are how clusters get produced and never used.`,
      `**Algorithm selection in one rule: millions of points, round blobs, known k — k-means.** Unknown k, need to explore granularities, n under 10,000 — hierarchical with Ward linkage. Arbitrary shapes or genuine outliers — DBSCAN or HDBSCAN. Data living on a non-linear manifold — reduce with UMAP first, then cluster in the embedding. The failure mode is applying k-means to data that violates all three of its assumptions and interpreting the confident output as real structure.`,
      `**Above roughly 50 features, Euclidean distances between points start converging — nearby and far become nearly indistinguishable — and every clustering algorithm degrades because its distance-based assignments become noisy.** Dimensionality reduction (PCA, UMAP) before clustering is not optional at that scale. There are no labels to tell the algorithm which features matter, so preprocessing and feature selection carry more weight in clustering than in any supervised task.`,
    ],
    checkQuestions: [
      {
        q: `A clustering of customers produces 5 clusters with silhouette score=0.62. A domain expert says 3 of the clusters look identical in terms of purchasing behaviour. How do you reconcile this?`,
        options: [
          `A) Trust the silhouette score — a score of 0.62 is strong evidence the 5 clusters are genuinely distinct, and the expert is likely mistaken`,
          `B) Run the clustering again with a different random seed to see if the expert's observation persists across runs`,
          `C) The silhouette score measures geometric separation, not semantic similarity — revisit feature selection so features encode purchasing behaviour, not noise dimensions`,
          `D) Increase k to 8 to subdivide the similar clusters and force more geometric separation`,
        ],
        answer: `C`,
      },
      {
        q: `You run k-means and DBSCAN on the same dataset. k-means silhouette=0.71, DBSCAN silhouette=0.43. Should you prefer k-means?`,
        options: [
          `A) Not necessarily — silhouette is biased toward convex clusters, and DBSCAN may be recovering the correct non-convex structure even while scoring lower`,
          `B) Yes — silhouette is an objective metric and a higher score unambiguously means better clustering quality`,
          `C) Yes — k-means always produces more stable clusters because it uses deterministic centroid updates`,
          `D) Not necessarily — but only if DBSCAN used more than 5 clusters, since silhouette scores decrease with fewer clusters`,
        ],
        answer: `A`,
      },
      {
        q: `A colleague proposes using k-means with k=150 to cluster 10,000 user-behaviour vectors with 512 features. What are the failure modes?`,
        options: [
          `A) The only problem is runtime — k=150 will be slow but will produce valid clusters once it converges`,
          `B) k-means cannot handle more than 100 clusters regardless of dataset size`,
          `C) Mini-batch k-means should be used instead, which resolves all three problems automatically`,
          `D) Three compounding problems: curse of dimensionality in 512 dimensions, k=150 gives unstable micro-clusters with ~67 points each, and initialisation sensitivity with k this large`,
        ],
        answer: `D`,
      },
      {
        q: `You need to explain to a non-technical stakeholder why you cannot report "clustering accuracy." What do you say?`,
        options: [
          `A) Accuracy can be computed but requires running clustering multiple times to average across seeds`,
          `B) Accuracy requires known correct labels to compare against — clustering is unsupervised with no ground truth, so you report silhouette score, cluster stability, and business validation instead`,
          `C) Accuracy is technically computable but misleading, so we report WCSS instead`,
          `D) Accuracy requires at least 10,000 samples; with smaller datasets only silhouette is valid`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The algorithm you pick encodes your definition of "similar" — k-means says round blobs, DBSCAN says density chains, hierarchical says nothing — and the math will always produce groups regardless of whether those groups reflect real structure or just the method's assumptions.`,
  },
  {
    id: 'kmeans',
    interactiveId: 'kmeans_viz',
    title: 'K-Means Clustering',
    subtitle: `Lloyd's algorithm, k-means++ init, silhouette, failure modes`,
    difficulty: 'foundational',
    estimatedMin: 36,
    tags: ['k-means', 'clustering', `Lloyd's algorithm`],
    summary: `You have unlabeled data and want to find structure in it. The simplest assumption: data lives in natural groupings. K-means formalizes this — assign each point to the nearest center, recompute centers as the mean of their members, repeat until nothing changes. That is Lloyd's algorithm, and it minimizes within-cluster sum of squares (WCSS). But k requires specifying the number of groups upfront, and a wrong k gives meaningless clusters even though the algorithm converges confidently. K-means also assumes clusters are convex, roughly spherical, and similar in size — violate those assumptions and it converges just as confidently to a wrong partition. And it finds a local minimum of WCSS, not the global one: the result depends on where you start. K-means++ initialization and running multiple restarts are not optional polish — a single random init is one of the most common sources of bad clusters in practice.`,
    keyPoints: [
      `**Lloyd's algorithm: assign each of n points to its nearest centroid (O(nk) per pass), recompute each centroid as the mean of its assigned points (O(n)), repeat until assignments stop changing.** Convergence is guaranteed because WCSS decreases at every step and there are only finitely many possible assignments. The catch: convergence is to a local minimum. The final clusters depend on where you initialized, and a bad init gives a bad local minimum that looks completely plausible.`,
      `**K-means++ initialization fixes the random-start problem: pick the first centroid uniformly at random, then choose each subsequent centroid with probability proportional to its squared distance from the nearest already-chosen center — D²(x) / sum D²(x').** This spreads starting centroids across the data rather than clustering them together. The result is an expected WCSS within O(log k) of optimal, and in practice much better solutions than random init. sklearn uses it by default with n_init=10 restarts.`,
      `**Choosing k with the elbow method: plot WCSS vs k.** Adding a centroid always reduces total distance, so WCSS always falls. The idea is to find the bend — where descent goes from steep to flat — and call that k. In practice, real data often has no clear elbow, or has two plausible ones. The elbow is a heuristic, not a decision rule, and it is frequently ambiguous.`,
      `**Silhouette analysis gives a cleaner k selection: for each point i, compute a(i) = mean intra-cluster distance and b(i) = mean distance to the nearest other cluster.** Silhouette s(i) = (b(i) - a(i)) / max(a(i), b(i)) ranges from -1 to 1. Maximize the mean silhouette over all points. Unlike the elbow, there is a clear optimisation target. But silhouette is biased toward convex, compact clusters — a DBSCAN result on crescent-shaped data can score low on silhouette even when it is geometrically correct.`,
      `**Failure mode — non-spherical clusters: k-means Voronoi cells are convex polytopes.** Two interleaved half-moons, concentric rings, or elongated ellipsoids get sliced incorrectly. The algorithm does not get confused — it converges cleanly to a wrong partition. The fix depends on the shape: GMM for elliptical clusters with any orientation, DBSCAN for arbitrary shapes, spectral clustering for manifold structure.`,
      `**Failure mode — unequal cluster sizes: with one true cluster of 10 points and another of 1,000, peripheral points from the large cluster can end up closer to the small cluster's centroid.** The small cluster steals those points, over-segmenting the large group. This is not noise or initialization sensitivity — it is a structural failure of the WCSS objective when cluster sizes differ by more than roughly 5x.`,
      `**Failure mode — outlier sensitivity: an outlier assigned to a centroid pulls that centroid toward it, distorting the cluster shape for every other member.** K-medoids avoids this because the representative must be an actual data point — an extreme outlier is outvoted by the dense core. If using k-means on contaminated data, run Isolation Forest first to strip outliers before fitting.`,
      `**Mini-batch k-means: instead of all n points per iteration, sample a batch of size B and update only the involved centroids.** Cost drops from O(nkd) to O(Bkd) per pass, making multi-million-point clustering practical. Quality stays within 1-2% of full k-means WCSS for B > 1,000. Use sklearn's MiniBatchKMeans as the default production implementation for large-scale work.`,
    ],
    checkQuestions: [
      {
        q: `K-means gives very different results on different runs on the same dataset. What is wrong and how do you fix it?`,
        options: [
          `A) The dataset has non-spherical clusters — switch to DBSCAN which is deterministic`,
          `B) Use a fixed random seed — this guarantees finding the global optimum of WCSS`,
          `C) Different runs converge to different local optima from random initialization — fix by using k-means++ init and running multiple restarts (n_init > 1), keeping the lowest WCSS result`,
          `D) The k value is wrong — instability always means k is set too high`,
        ],
        answer: `C`,
      },
      {
        q: `You apply k-means to 50,000 customer vectors with 200 features. Silhouette scores are uniformly low (0.08–0.12) for all k from 2 to 20. What does this tell you and what do you do?`,
        options: [
          `A) Uniformly low silhouette across all k signals the curse of dimensionality or absent cluster structure — apply PCA to ~20-30 dimensions, inspect 2D projections for visual separation, and reconsider whether the features encode the relevant business similarity`,
          `B) The silhouette threshold for high-dimensional data is lower — scores of 0.08-0.12 are actually acceptable for 200 features`,
          `C) Increase k beyond 20 — silhouette scores will improve once k is large enough to capture fine-grained subgroups`,
          `D) Switch to hierarchical clustering — silhouette is known to be incompatible with k-means on large datasets`,
        ],
        answer: `A`,
      },
      {
        q: `A k-means run with k=5 produces one cluster with 90% of the data and four clusters each with 2-3%. What likely went wrong?`,
        options: [
          `A) The dataset is too large for k-means — use MiniBatchKMeans for datasets where one cluster dominates`,
          `B) k=5 may be too high, or there are true outliers that each captured a tiny cluster, or initialization placed 4 centroids in low-density regions — diagnose by trying k=2,3 and checking silhouette`,
          `C) The silhouette metric should be replaced with WCSS to properly diagnose unequal cluster sizes`,
          `D) This is expected behaviour for k-means on imbalanced datasets — use class weights to rebalance`,
        ],
        answer: `B`,
      },
      {
        q: `What is the difference between k-means and k-medoids, and when would you choose each?`,
        options: [
          `A) K-means is faster but only works on binary data; k-medoids handles continuous features`,
          `B) They are mathematically identical — the difference is only that k-medoids uses Manhattan distance instead of Euclidean`,
          `C) K-means uses the arithmetic mean centroid; k-medoids uses an actual data point as the representative — choose k-medoids when data has significant outliers, non-Euclidean distances, or when interpretable representative examples are needed`,
          `D) K-medoids always produces better clusters — k-means should only be used when runtime is the top concern`,
        ],
        answer: `C`,
      },
      {
        q: `Explain why k-means is equivalent to the EM algorithm on a specific probabilistic model. What does this reveal about its assumptions?`,
        options: [
          `A) K-means is equivalent to EM on a Poisson mixture model, which reveals it assumes count-distributed features`,
          `B) K-means is the hard-assignment limit of EM on a GMM where all components share the same isotropic covariance σ²I and σ→0 — revealing assumptions of spherical, equal-radius clusters and hard membership`,
          `C) K-means is equivalent to EM only when all clusters have the same size, which is why it fails on unequal cluster sizes`,
          `D) K-means is the special case of EM where the M-step is replaced by gradient descent, not a probabilistic model equivalence`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `K-means converges every time — the dangerous part is that it converges just as confidently when your clusters are non-spherical, unequal in size, or contaminated by outliers as when everything is perfect.`,
    interactiveId: 'kmeans_viz',
  },
  {
    id: 'hierarchical',
    title: 'Hierarchical Clustering',
    subtitle: 'Linkage criteria, dendrograms, when hierarchy beats flat clustering',
    difficulty: 'intermediate',
    estimatedMin: 34,
    tags: ['hierarchical clustering', 'dendrogram', 'linkage'],
    summary: `K-means forces you to commit to k before seeing any results, which means you either run it a dozen times or guess. Hierarchical clustering solves this by recording every possible merge from n singletons up to one giant cluster in a single structure — the dendrogram. Cut the tree at any height and you get a flat clustering; cut lower for more groups, higher for fewer. One run gives you every possible k simultaneously. The linkage criterion controls how inter-cluster distance is measured: Ward linkage, the default in most applications, picks merges that minimize the increase in within-cluster variance, producing compact and similarly-sized clusters without needing k upfront.

The cost is stark: O(n²) memory to store the pairwise distance matrix and O(n³) compute for the merge sequence. The cap of roughly n=10,000 is real, and any proposal to run hierarchical clustering on large datasets needs to go through HDBSCAN or a subsampling strategy instead.`,
    keyPoints: [
      `**Agglomerative clustering (bottom-up): begin with n clusters of one point each.** At each step, merge the two clusters with the smallest inter-cluster distance according to the chosen linkage. Repeat n-1 times until one cluster remains. The dendrogram records the height — the inter-cluster distance — at which each merge occurred. The tree encodes every possible flat clustering simultaneously, which is the entire advantage over k-means.`,
      `**Single linkage (nearest-neighbour): inter-cluster distance is the distance between the two closest points across the clusters.** One nearby bridging point causes a merge regardless of how far apart the bulk of the clusters are — the chaining effect. A single noisy point can chain two otherwise well-separated groups together. Useful for detecting filamentary structure, pathological for finding compact blobs.`,
      `**Complete linkage (furthest-neighbour): inter-cluster distance is the distance between the two most distant points.** Two clusters only merge when their most distant members are close, producing compact, roughly equal-diameter groups. One extreme outlier inflates a cluster's diameter and delays all future merges involving that cluster. More stable than single linkage for blob-shaped data, but still sensitive to outliers.`,
      `**Ward linkage: at each step, merge the pair of clusters that minimizes the increase in total within-cluster sum of squares — equivalent to minimizing the variance of the merged cluster.** Ward produces compact, similar-size clusters that often reproduce k-means results without requiring k upfront. It is the default choice in most applications, and for most blob-shaped data it is the right one.`,
      `**Reading a dendrogram: the y-axis is the linkage distance at each merge.** Long vertical segments — large height gaps between consecutive merges — mark natural cluster boundaries. Draw a horizontal cut line across the tree: each branch it crosses becomes one cluster. A well-placed cut sits just below a long vertical segment, at the transition from many small nearby merges to one large distant merge. No long vertical segments means no obvious discrete structure.`,
      `**Cophenetic correlation coefficient: for each pair of points, the cophenetic distance is the tree height at which they first merge.** Correlate those with the original pairwise distances. A value above 0.8 means the dendrogram faithfully summarizes the data's distance structure. A low value signals that hierarchical clustering is a poor fit for this data — the method is imposing a tree structure that the data does not have.`,
      `**Computational limits: naive agglomerative clustering is O(n³) time and O(n²) memory — storing 10,000² pairs already needs roughly 800 MB.** For single linkage, SLINK brings this to O(n²) time and O(n) space. For n above 10,000, use BIRCH (compress data into a Clustering Feature tree, then run agglomerative on leaf nodes), HDBSCAN, or subsample to a representative 5,000-point subset.`,
      `**Reach for hierarchical clustering when: you need multiple granularities from one run (gene families, product taxonomies, geographic hierarchies), k is unknown and the dendrogram will reveal natural cut points, or the domain has genuine hierarchy that flat methods cannot capture.** Using it as a drop-in replacement for k-means on large unstructured data is the wrong application.`,
    ],
    checkQuestions: [
      {
        q: `You are clustering genes based on expression profiles. Why might hierarchical clustering with Ward linkage be more appropriate than k-means?`,
        options: [
          `A) Hierarchical clustering is always preferred for biological data because gene expression features are non-Gaussian`,
          `B) Ward linkage specifically handles the high dimensionality of gene expression data better than k-means centroids`,
          `C) K-means is faster but hierarchical clustering is needed when the dataset has more than 500 genes`,
          `D) Gene expression clusters have a natural biological hierarchy across pathway, module, and process levels — one hierarchical run gives every granularity simultaneously, and Ward linkage produces the compact co-expression groups biologists compare to known pathway databases`,
        ],
        answer: `D`,
      },
      {
        q: `Two researchers use the same dataset but different linkage criteria. Researcher A uses single linkage and gets one large cluster containing 95% of the data. Researcher B uses Ward linkage and gets 5 balanced clusters. Who is right?`,
        options: [
          `A) Researcher B is right — single linkage always produces degenerate results due to chaining and should never be used`,
          `B) Researcher A is right — one large cluster means the data has no true subgroup structure`,
          `C) Both results are valid given their linkage criterion — the correct interpretation depends on whether the data has filamentary chain structure (A is right) or five distinct blobs connected by bridges (B is right); validate with PCA/UMAP visualization and cophenetic correlation`,
          `D) Neither is right — the correct approach is to average the two results`,
        ],
        answer: `C`,
      },
      {
        q: `How do you determine the optimal cut height on a dendrogram when there is no obvious long gap?`,
        options: [
          `A) Always cut at the median linkage height, which maximises cluster balance`,
          `B) The absence of a long gap proves the data has no cluster structure — stop and use a different algorithm`,
          `C) Use the accelerations plot (second derivative of linkage distances), silhouette analysis across different cuts, domain knowledge, or compare a GMM BIC curve — no single method is authoritative when gaps are absent`,
          `D) Use complete linkage instead — it always produces clearer gaps than Ward linkage`,
        ],
        answer: `C`,
      },
      {
        q: `A colleague wants to run hierarchical clustering on 100,000 points. What do you tell them?`,
        options: [
          `A) Use single linkage — its SLINK implementation runs in O(n log n) and handles 100,000 points easily`,
          `B) Hierarchical clustering is feasible up to 500,000 points with modern hardware; the O(n²) limit only applies to Ward linkage`,
          `C) Subsample to 10,000 points, run hierarchical clustering, then assign remaining points by nearest-centroid`,
          `D) Naive agglomerative clustering on 100,000 points requires ~40 GB for the distance matrix and months of O(n³) compute — use HDBSCAN (O(n log n) with hierarchical structure), BIRCH + agglomerative, or subsample to 5,000-10,000 points`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `The dendrogram answers "what is the right k?" by encoding cluster structure at every granularity in one run — natural boundaries show up as long vertical segments, and the absence of long segments means the data probably lacks discrete structure.`,
    interactiveId: 'hierarchical_clustering_viz',
  },
  {
    id: 'dbscan',
    interactiveId: 'dbscan_viz',
    title: 'DBSCAN',
    subtitle: 'Core/border/noise points, eps and minPts, non-spherical clusters',
    difficulty: 'intermediate',
    estimatedMin: 36,
    tags: ['DBSCAN', 'density-based', 'outlier detection'],
    summary: `K-means requires you to specify k upfront and assumes clusters are round blobs — two requirements that fail simultaneously when you have GPS traces, satellite images, or any data where cluster shapes are determined by geography or physics rather than convenience. DBSCAN doesn't require specifying the number of clusters upfront and doesn't care what shape they are. It defines clusters as dense regions of points separated by sparse regions: a core point has at least minPts neighbors within radius ε. Clusters grow by following density chains — if A is core and B is within ε of A, and C is within ε of B, then A, B, and C belong to the same cluster regardless of whether A and C are close directly. That chain-following is what lets clusters take any shape. Points in sparse regions receive no cluster label — they are noise, which is DBSCAN's built-in outlier detection. The main limitation is the single ε threshold: it breaks when two clusters have different internal densities. HDBSCAN solves this by building a hierarchy across all ε values and extracting the most stable clusters, making it the practical default over vanilla DBSCAN.`,
    keyPoints: [
      `**Core point: at least minPts neighbors within distance ε (including itself).** Border point: fewer than minPts neighbors, but within ε of a core point — on the edge of a dense region. Noise point: not within ε of any core point — isolated in a sparse region. Only core points seed and expand clusters. Border points join but do not grow them. Noise points receive label -1 — this is DBSCAN's built-in outlier detection, and it is operationally valuable: ambiguous points are flagged rather than force-assigned.`,
      `**Density-reachability is the growth mechanism: q is directly density-reachable from p if q is within ε of p and p is a core point.** Density-reachable extends this transitively along a chain p₁, p₂, ..., pₙ where each step is directly density-reachable. Following chains is what lets clusters wrap around curves and through thin corridors — the structure that causes k-means to fail on crescent or ring shapes is exactly what DBSCAN handles naturally.`,
      `**Setting ε with the k-distance plot: for each point, compute its distance to its k-th nearest neighbor (k=minPts), then sort those distances ascending.** Dense-region points have small k-distances; sparse-region points have large ones. The knee of this curve — where k-distance jumps sharply — marks the natural density boundary. Set ε at the knee. No clear knee means the data may not have the kind of density structure DBSCAN needs, and you should consider hierarchical clustering or GMM instead.`,
      `**Setting minPts: minPts ≥ ln(n) is a reasonable floor for small datasets; minPts = 2×d is a lower bound based on dimensionality.** Increase minPts to raise the density requirement — sparser points become noise, fewer fragmented micro-clusters. Decrease it to be more permissive, at the cost of sensitivity to noise. For 2D data, minPts=5 is a practical starting point; for higher-dimensional data, push toward 10-20.`,
      `**DBSCAN vs k-means: choose DBSCAN when cluster shapes are non-convex (k-means Voronoi cells will slice them incorrectly), when outliers should not distort cluster shapes (k-means assigns them and pulls centroids), or when k is unknown and cluster sizes vary widely.** DBSCAN fails on data with uniform density and no density gap to define cluster boundaries, or on clusters with very different densities that a single ε cannot simultaneously accommodate.`,
      `**Time complexity: O(n log n) with a spatial index (k-d tree or ball tree) for low-dimensional data (d ≤ 10).** Without a spatial index — or in high dimensions where those indexes degrade — DBSCAN falls back to O(n²). K-d trees stop being useful above roughly d=20. The practical ceiling: DBSCAN is fast on spatial and geographic data, slow on 128-dimensional embeddings. Reduce dimensions before running DBSCAN at high dimensionality.`,
      `**HDBSCAN: instead of one ε value, build a hierarchy of clusterings across all ε by computing the minimum spanning tree of mutual reachability distances.** Extract the clusters most stable across a range of ε — stability measures how long a cluster persists as ε changes. Different clusters can have their own effective ε, making HDBSCAN robust to varying density. No manual ε tuning is required. For production density-based clustering, HDBSCAN is the right default.`,
      `**Production fit: DBSCAN suits GPS clustering (turning location pings into visited places), anomaly detection (noise points are outliers by definition), image segmentation (pixel clusters of arbitrary shape), and sensor event detection.** The explicit noise label is operationally valuable — route ambiguous points to human review rather than making an overconfident cluster assignment that downstream systems will treat as ground truth.`,
    ],
    checkQuestions: [
      {
        q: `K-means gives 5 circular clusters on GPS location data, but you suspect the true structure has non-circular geographic regions. How do you set up DBSCAN and validate it?`,
        options: [
          `A) Use minPts=2 to maximise sensitivity, then validate by counting how many more clusters DBSCAN finds compared to k-means`,
          `B) Set eps by taking the mean pairwise distance divided by 10, which is the standard GPS calibration rule`,
          `C) DBSCAN is not suitable for GPS data because lat/lon coordinates require spherical distance, which DBSCAN does not support`,
          `D) Use the k-distance plot with k=4 to find eps at the knee; validate by inspecting clusters on a map for geographic boundary alignment, checking that noise points are genuinely sparse areas, and adjusting eps if known locations are mislabelled as noise`,
        ],
        answer: `D`,
      },
      {
        q: `DBSCAN with eps=0.5 and minPts=5 produces 1 cluster containing 95% of data and 200 noise points. What does this indicate and what do you try?`,
        options: [
          `A) eps is too small — the radius is not wide enough to connect the dense regions into their natural clusters`,
          `B) minPts is too high — reducing it to 2 will split the single large cluster into meaningful subgroups`,
          `C) One giant cluster means eps is too large — reduce eps using the k-distance plot knee, halving incrementally; if no density gap exists between groups, DBSCAN is the wrong algorithm for finding subgroups`,
          `D) The 200 noise points indicate the dataset has significant outliers that are preventing proper cluster formation — remove them first`,
        ],
        answer: `C`,
      },
      {
        q: `You apply DBSCAN to customer embeddings in 128 dimensions and get mostly noise (90% of points labelled -1). What is happening and how do you fix it?`,
        options: [
          `A) The minPts value is set too high for 128-dimensional data — reduce it to 2 and re-run`,
          `B) DBSCAN labels as noise any point that is not a core point, so 90% noise just means the dataset has few dense regions — this is the correct output`,
          `C) The training data is contaminated — 90% of points are genuine anomalies and only 10% are normal`,
          `D) In 128 dimensions, Euclidean distances converge so no point has many neighbours within a discriminating eps — apply PCA or UMAP to reduce to 10-20 dimensions where neighbourhood structure is meaningful before re-running DBSCAN`,
        ],
        answer: `D`,
      },
      {
        q: `What is the difference between noise in DBSCAN and outliers detected by Isolation Forest? When would you use each for anomaly detection?`,
        options: [
          `A) They are equivalent — both define anomalies as points with fewer than k neighbours within a fixed radius`,
          `B) DBSCAN noise requires labelled normal data; Isolation Forest is fully unsupervised`,
          `C) DBSCAN noise is density-defined and local — points in sparse regions relative to eps/minPts; Isolation Forest gives a global continuous anomaly score based on isolation depth — use DBSCAN when you simultaneously want clusters and outliers on low-dimensional data; Isolation Forest when you need ranked anomaly scores or high-dimensional data`,
          `D) Isolation Forest is always superior — DBSCAN noise labelling should only be used as a preprocessing step before Isolation Forest`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `DBSCAN finds clusters of any shape and labels outliers explicitly — but a single ε threshold breaks when clusters have different densities, which is exactly the problem HDBSCAN was built to fix.`,
    interactiveId: 'dbscan_viz',
  },
  {
    id: 'pca',
    interactiveId: 'pca_viz',
    title: 'PCA — Principal Component Analysis',
    subtitle: 'Eigenvectors, explained variance, when to use and when it fails',
    difficulty: 'intermediate',
    estimatedMin: 38,
    tags: ['PCA', 'dimensionality reduction', 'eigenvectors', 'variance'],
    summary: `High-dimensional data is hard to visualize and hard to reason about. The naive approach — pick two features and scatter-plot — throws away most of the information. PCA finds the directions of maximum variance and projects the data onto them. The first principal component explains the most variance, the second the most of what's left, and so on. These directions are eigenvectors of the covariance matrix. Keep the top k eigenvectors and you get a k-dimensional representation that retains as much variance as possible. But maximum variance is not always the most informative direction. If the clusters you care about don't differ in variance — two classes with the same spread but different means — PCA can miss them entirely. That's why supervised dimensionality reduction (LDA) exists. And for non-linear structure — spirals, rings, curved manifolds — PCA projects them into a shapeless cloud. Standardize before fitting: a dollar-valued income feature has variance billions of times larger than a binary flag, and without standardization it will dominate every principal component regardless of whether it is informative.`,
    keyPoints: [
      `**PCA mechanics: center X, compute covariance matrix C = (1/n) X^T X, decompose C = V Λ V^T where columns of V are eigenvectors and Λ holds the corresponding eigenvalues.** Project data as Z = XV. The first column of V is the direction of maximum variance (largest eigenvalue). In practice, use SVD of X (X = UΣV^T) rather than eigendecomposition of C — numerically more stable and efficient for large, sparse matrices.`,
      `**Explained variance ratio: eigenvalue λ_k divided by the sum of all eigenvalues gives the fraction of total variance captured by component k.** The cumulative sum tells you how many components to keep. Target 90-95% for preprocessing, 99% for compression. The scree plot — eigenvalues vs component index — shows an elbow where substantial-variance components give way to noise components. But explained variance is not the same as task-relevant information: the direction explaining 85% of variance could be illumination in face recognition, not identity.`,
      `**Standardize before PCA: income in dollars (range $20k-$500k) has variance roughly 10 billion times larger than a binary flag (variance ~0.25).** Without standardization, the first few components will be almost entirely the income dimension, and all the information in other features gets compressed into later components you are likely to discard. StandardScaler brings everything to zero mean and unit variance. The only exception: features already on the same scale where you deliberately want high-variance features to dominate.`,
      `**What PCA keeps and what it discards: it preserves global linear structure — large-scale variance, correlations among features, Euclidean distances approximately.** It discards local non-linear structure — clusters on curved manifolds, concentric rings, spiral patterns. A PCA projection to 2D often looks like a shapeless cloud even when the original high-dimensional data has tight non-linear clusters. This is not a failure of PCA — it is doing exactly what it was designed to do.`,
      `**PCA for preprocessing vs visualization: as a preprocessing step before k-means, SVM, or logistic regression, keep enough components for 90-99% explained variance — this removes noise dimensions, speeds up computation, and tames the curse of dimensionality.** For visualization, project to 2D or 3D. The 2D PCA projection is the best linear 2D view of the data, but linear may not be sufficient — use t-SNE or UMAP when non-linear cluster structure matters for what you are trying to show.`,
      `**Kernel PCA: apply PCA inside a high-dimensional feature space defined implicitly by a kernel k(x, x') = φ(x)·φ(x').** An RBF kernel maps data to infinite dimensions and finds non-linear principal components — enough to unroll a Swiss roll or separate concentric rings. The cost is O(n²) time and O(n²) memory for the kernel matrix, making it impractical above n=10,000.`,
      `**Incremental PCA and randomized SVD: standard PCA loads all data into memory.** Incremental PCA processes mini-batches and updates component estimates iteratively. Randomized SVD (sklearn TruncatedSVD) approximates the top k components via random projections in O(nkd) time rather than O(nd²) — dramatically faster when n is large and k is small. For millions of rows, randomized SVD is the implementation to use.`,
      `**When PCA fails as a feature extractor: when task-relevant signal lives in low-variance directions — in face recognition, differences between individuals have lower variance than illumination and pose changes, so PCA de-emphasizes identity.** When there are non-linear relationships between features and target — PCA components are linear combinations and cannot model curves. When features are mixed continuous and categorical — PCA assumes continuous inputs; encode or transform categoricals first.`,
    ],
    checkQuestions: [
      {
        q: `You run PCA on a dataset with 100 features. The first component captures 85% of variance and the second captures 8%. How do you decide how many components to keep for a downstream classifier?`,
        options: [
          `A) Always keep only the first component when it captures more than 80% of variance — additional components add noise`,
          `B) Keep components until cumulative variance reaches 95%, then cross-validate at several component counts — also test excluding component 1 in case it is a confound rather than a signal`,
          `C) The 85% variance in one component means 1 component is sufficient for any downstream task`,
          `D) Keep all 100 components — PCA is only used for visualization, not for feature selection before classifiers`,
        ],
        answer: `B`,
      },
      {
        q: `A colleague skips standardisation before PCA on a dataset with features including income (range $20k-$500k), age (18-80), and binary flags (0 or 1). What goes wrong?`,
        options: [
          `A) PCA will fail to converge because the covariance matrix becomes singular when features have different scales`,
          `B) The binary flags will dominate all principal components because their values are bounded between 0 and 1`,
          `C) PCA is scale-invariant and standardisation is only needed for distance-based algorithms like k-means`,
          `D) Income dominates all principal components because its variance (~10 billion times larger than binary flags) dwarfs the contribution of age and binary features — all information in those features is compressed into later discarded components`,
        ],
        answer: `D`,
      },
      {
        q: `You apply PCA to reduce 1,000-dimensional text embeddings to 50 dimensions before running k-means. Cluster quality is poor. What might PCA have discarded?`,
        options: [
          `A) PCA cannot be applied to text embeddings — use word2vec dimensionality reduction instead`,
          `B) Nothing — PCA preserves 90%+ variance so cluster quality problems must be caused by k-means hyperparameters`,
          `C) PCA discards low-variance directions, which may contain the cluster-discriminative signal for topic differences — try UMAP (which preserves local neighbourhood structure) or cluster directly with cosine distance in the full embedding space`,
          `D) PCA discarded the stop words that k-means needs to separate topics correctly`,
        ],
        answer: `C`,
      },
      {
        q: `Two datasets have the same dimensions and PCA explained-variance ratios. Are they similar datasets? What would you additionally check?`,
        options: [
          `A) Yes — identical eigenvalue spectra prove the datasets have the same underlying structure`,
          `B) No — check PCA loadings (which features drive each component), scatterplots of PC1 vs PC2, reconstruction error distribution, and correlations between features and components`,
          `C) Compare only the first two components — if PC1 and PC2 loadings match, the datasets are structurally equivalent`,
          `D) Identical explained-variance ratios are sufficient to confirm similarity — no additional checks are needed`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `PCA finds directions of maximum variance — and the task-discriminative signal might live in a low-variance direction that PCA throws out, so variance explained is not a reliable proxy for information preserved for a downstream model.`,
    interactiveId: 'pca_viz',
  },
  {
    id: 'tsne_umap',
    title: 't-SNE & UMAP',
    subtitle: 'Perplexity, why t-SNE clusters mislead, UMAP vs t-SNE tradeoffs',
    difficulty: 'advanced',
    estimatedMin: 40,
    tags: ['t-SNE', 'UMAP', 'visualisation', 'manifold'],
    summary: `PCA projects high-dimensional data onto a flat subspace — which means non-linear structure like spirals, nested rings, and curved manifolds gets destroyed. t-SNE and UMAP are non-linear alternatives designed to preserve neighborhood structure in 2D. But they solve different problems and have different failure modes that are routinely confused. t-SNE converts high-dimensional pairwise distances into probabilities, then places points in 2D to match those probabilities — minimizing KL divergence between the two. The t-distribution's heavy tails prevent points from collapsing to the center, but as a side effect they deliberately distort inter-cluster distances. Two clusters far apart in a t-SNE plot tell you nothing about how far apart they are in the original space. UMAP is grounded in Riemannian geometry and builds a weighted nearest-neighbor graph in high-d, then finds a low-d layout that preserves that graph structure. UMAP approximately preserves global topology — inter-cluster distances carry some meaning. The rule is simple and broken constantly: t-SNE and UMAP are for looking at data, not for generating features. Running k-means on t-SNE output is not just suboptimal — it is wrong.`,
    keyPoints: [
      `**t-SNE objective: compute pairwise similarity in high-d as p_{ij} ∝ exp(−‖x_i − x_j‖² / 2σ_i²), where σ_i is set by perplexity.** In 2D, compute q_{ij} ∝ (1 + ‖y_i − y_j‖²)⁻¹ — a t-distribution with one degree of freedom. Minimize KL(P || Q) via gradient descent. The t-distribution's heavier tails prevent crowding (all high-d points collapsing into a small 2D region), but at the cost of exaggerating distances between separated groups — a structural distortion, not a bug.`,
      `**Perplexity controls how many neighbors each point considers.** Low perplexity (5-10) makes each point compare only its immediate vicinity — tight local clusters form, global structure evaporates. High perplexity (100-500) pulls in more context — broader structure emerges but local detail blurs. Run at several values (5, 30, 100) and look for structures that persist across all of them. If the layout changes dramatically with perplexity, there is no stable structure to trust.`,
      `**t-SNE 2D distances are not trustworthy: cluster separation in the 2D plot is an artifact of the t-distribution's distortion, not a signal about how far apart clusters are in high-d space.** Cluster size is meaningless too — t-SNE inflates small dense groups and compresses large sparse ones. A single run is also unreliable because the optimization is non-convex. Run 3-5 times and keep structures that appear consistently across runs and perplexity values.`,
      `**UMAP builds a k-nearest-neighbor graph in high-d, weighted by approximate geodesic distance on the data manifold, then finds a 2D layout that preserves that graph using cross-entropy loss.** The result approximately preserves global topology: if cluster A is between B and C in the neighborhood graph, it tends to appear between them in the plot. That global fidelity is what makes UMAP more informative than t-SNE for understanding overall data geometry.`,
      `**UMAP parameters that matter: n_neighbors (primary dial — higher values pull in more global context, lower values focus on local detail, start at 15 and try 5, 50, 100), min_dist (how tightly embedded points cluster together — small values give tight clusters, large values spread them out), and metric (euclidean by default, cosine for text embeddings, hellinger for probability vectors).** Stable structures across n_neighbors values are more trustworthy.`,
      `**Never run k-means on t-SNE output.** The distorted inter-cluster distances will mislead k-means into incorrect groupings at cluster boundaries. Run clustering in the original high-d space or in PCA-reduced space, then project to 2D UMAP for visualization. Coloring a UMAP plot by cluster labels derived from the original space is the correct workflow. UMAP 2D output can support clustering when global distances matter, but this is still an approximation.`,
      `**Speed: standard t-SNE is O(n²) — unusable for n above 10,000.** Barnes-Hut t-SNE approximates repulsive forces and reaches O(n log n), handling up to roughly 100,000 points. UMAP is O(n log n) by default and runs 5-100x faster in practice. For n above 100,000, use UMAP with approximate nearest neighbors (HNSW, Annoy). For n above 1,000,000, reduce to PCA-50 first, then UMAP.`,
      `**Interpretation pitfalls: visual clusters in a 2D plot do not confirm real clusters exist in the original space — validate by running a clustering algorithm in the original space and checking alignment.** UMAP can preserve preprocessing artifacts — batch effects, normalization choices, and PCA initialization all leave fingerprints in the embedding. Every visual insight from t-SNE or UMAP needs quantitative backup before being acted on.`,
    ],
    checkQuestions: [
      {
        q: `You run t-SNE with perplexity=5 and see 50 tiny, tight clusters. You run with perplexity=100 and see 3 blobs. Which represents the "true" structure?`,
        options: [
          `A) Perplexity=5 is always more accurate — lower perplexity reveals true local structure that high perplexity obscures`,
          `B) Perplexity=100 is always more accurate — t-SNE requires high perplexity to capture meaningful global structure`,
          `C) Neither alone is definitive — run at intermediate perplexities (15, 30, 50), use UMAP for comparison, and run k-means in the original high-dimensional space; structures that appear in both the parametric clustering and t-SNE across perplexity values are most likely real`,
          `D) Both are wrong — t-SNE is unreliable at any perplexity setting and should not be used for exploratory analysis`,
        ],
        answer: `C`,
      },
      {
        q: `A team visualises 50,000 single-cell RNA-seq measurements with t-SNE, sees 12 distinct clusters, and runs k-means on the 2D t-SNE embedding. Explain two problems with this approach.`,
        options: [
          `A) t-SNE is too slow for 50,000 cells and k-means cannot handle RNA-seq data directly`,
          `B) The number of clusters should be determined by BIC, not visual inspection; and k-means should use cosine distance for RNA-seq data`,
          `C) k-means on t-SNE embeddings uses distances distorted by the t-distribution so cluster boundaries are wrong; and the 12 apparent clusters may be artefacts of the perplexity setting that disappear under different runs or perplexity values`,
          `D) t-SNE does not work on high-dimensional data — PCA must be applied first, after which k-means on the 2D output is valid`,
        ],
        answer: `C`,
      },
      {
        q: `Your t-SNE plot shows two large clusters that are completely separated. Does this mean these two groups are very different from each other in the original space?`,
        options: [
          `A) Yes — complete visual separation in t-SNE directly corresponds to large distance in the original high-dimensional space`,
          `B) Yes — t-SNE's heavy-tailed t-distribution preserves inter-cluster distances proportionally`,
          `C) No — t-SNE's repulsive forces push any locally-separated groups apart visually regardless of their true high-dimensional distance; verify with actual centroid distance, UMAP comparison, or statistical tests on original features`,
          `D) Only if the same separation appears at both low and high perplexity settings`,
        ],
        answer: `C`,
      },
      {
        q: `You need to compress 768-dimensional BERT embeddings to 2D for visualisation and downstream k-means clustering. What is your pipeline and why?`,
        options: [
          `A) Apply UMAP directly from 768D to 2D, then run k-means on the 2D output — UMAP preserves distances well enough for clustering`,
          `B) Apply t-SNE to 2D for visualisation and k-means simultaneously — t-SNE is preferred for BERT embeddings because it handles the dense manifold structure better`,
          `C) Apply PCA to 50D (clustering step), run k-means on the 50D space, then apply UMAP to 2D separately (visualisation step), colouring by k-means labels — clustering on PCA-50 uses meaningful Euclidean distances; UMAP 2D is for display only`,
          `D) Run k-means directly in 768D — dimensionality reduction before clustering discards information and reduces clustering accuracy`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `t-SNE and UMAP are for looking at data, not for generating features — inter-cluster distances in t-SNE are deliberately distorted, UMAP's are approximate, and clustering on either's 2D output will mislead you at exactly the boundaries that matter most.`,
    interactiveId: 'tsne_viz',
  },
  {
    id: 'autoencoders_dim_reduction',
    title: 'Autoencoders for Dimensionality Reduction',
    subtitle: 'Encoder-decoder mechanics, bottleneck, VAE, anomaly detection via reconstruction error',
    difficulty: 'advanced',
    estimatedMin: 38,
    tags: ['autoencoder', 'VAE', 'dimensionality reduction', 'anomaly detection'],
    summary: `PCA can only find flat hyperplanes through high-dimensional data — it cannot model curved manifolds, non-linear correlations, or complex multi-feature dependencies. An autoencoder solves this by learning a compressed representation through a narrow bottleneck: the encoder maps input x to a low-dimensional latent vector z, the decoder maps z back to a reconstruction x̂, and training minimizes reconstruction loss. Where PCA finds the best flat subspace, an autoencoder with non-linear activations fits a curved manifold. The most practically useful application is anomaly detection: train on normal data, then flag anything with high reconstruction error at inference. Two failure modes kill this — a bottleneck too wide (the model memorizes and reconstructs anomalies just as well as normal data) or training data that contains anomalies (the model learns their patterns too). The Variational Autoencoder extends the approach by forcing the latent space to be smooth and continuous, enabling interpolation and generative sampling — at the cost of more complex training.`,
    keyPoints: [
      `**Autoencoder structure: encoder f_θ: ℝ^d → ℝ^k (k << d), decoder g_φ: ℝ^k → ℝ^d, trained end-to-end to minimize reconstruction loss L(x, g_φ(f_θ(x))).** MSE for continuous features, cross-entropy for binary or probability outputs. The bottleneck forces the network to compress the essential structure of x into k dimensions — anything it cannot reconstruct is discarded. Non-linear activation functions are what allow the bottleneck to capture curved manifolds rather than just flat subspaces.`,
      `**Autoencoder vs PCA: a shallow autoencoder with linear activations and MSE loss recovers the same subspace as PCA — the eigenvectors of the covariance matrix.** Add non-linear activations and the autoencoder becomes non-linear PCA, fitting a curved low-dimensional manifold. Spirals, non-linear clusters, and any structure that lives on a curved surface in high-d space can be captured by an autoencoder but not by PCA.`,
      `**Variational Autoencoder: the encoder outputs parameters of a distribution — mean μ and log-variance log σ².** The latent code is sampled:

$z = μ + σ · ε where ε ~ N(0,I). Training minimizes reconstruc$

tion loss plus KL divergence between the posterior q(z|x) = N(μ, σ²) and prior p(z) = N(0,I). The KL term compresses the latent space toward a smooth Gaussian — similar inputs get similar latent distributions, enabling meaningful interpolation. Without the KL term, the latent space fragments and interpolation between latent vectors produces meaningless output.`,
      `**Anomaly detection workflow: train exclusively on normal data.** At inference time, compute reconstruction error per sample. Normal patterns have been learned — normal samples reconstruct well. Anomalous inputs differ from anything in training, so the decoder reconstructs them poorly — high reconstruction error flags them. The advantage over simpler methods: the autoencoder captures complex multi-feature dependencies simultaneously (e.g., all 500 sensor readings and their correlations) that distance-based methods miss.`,
      `**Bottleneck size determines whether the approach works: too small, and important normal structure is lost — normal samples also reconstruct poorly, making anomaly scores uninformative.** Too large, and the decoder memorizes training data — anomalies reconstruct just as well as normal points, and no separation exists. Start by estimating the intrinsic dimensionality of the normal data from a PCA scree plot (how many components for 95% reconstruction quality), use that as a starting bottleneck size, and tune based on validation anomaly detection performance.`,
      `**Denoising autoencoders: corrupt the input with noise (masking, Gaussian noise, random dropout) and train the network to reconstruct the clean version.** The model is forced to learn which features carry signal vs noise — producing representations more robust than a standard autoencoder. Better generalization, better anomaly detection in noisy environments. Denoising autoencoders are also the theoretical precursor to diffusion models.`,
      `**Reconstruction error failure modes: training data contamination — anomalies present in the "normal" training set teach the model to reconstruct them.** Manifold coincidence — anomalies that happen to lie on the learned normal manifold get reconstructed accurately despite being anomalous. High-variance feature dominance — reconstruction error is summed across all features, so a few high-variance features can drown out the signal from anomalous low-variance features. Fix: normalize reconstruction error per feature dimension, or train a one-class classifier in latent space.`,
      `**Masked autoencoders (MAE): mask a large fraction of input patches (75% in vision transformers) and train the encoder on visible patches to reconstruct the masked ones.** This forces the model to learn global semantic structure rather than local pixel patterns. In anomaly detection, a model trained with high masking ratio is more sensitive to semantic anomalies (wrong content type) and less sensitive to superficial texture anomalies (noise, blur) compared to a pixel-reconstruction autoencoder.`,
    ],
    checkQuestions: [
      {
        q: `You train an autoencoder for anomaly detection and find that reconstruction error is high for both normal and anomalous samples. What might be wrong?`,
        options: [
          `A) High reconstruction error on all samples means the bottleneck is too large — reduce it to force the model to discriminate`,
          `B) The training data must be contaminated with anomalies — retrain with a cleaner dataset`,
          `C) High reconstruction error on normal samples means the autoencoder is underfitting — bottleneck too small, model too shallow, or features not standardised; separately, if error is low for anomalies, the bottleneck is too large and the model is memorising`,
          `D) Autoencoders always have high reconstruction error initially — the anomaly threshold should be set relative to the training error distribution regardless of its absolute level`,
        ],
        answer: `C`,
      },
      {
        q: `What is the reparameterisation trick in a VAE and why is it necessary?`,
        options: [
          `A) It replaces the KL divergence term with a simpler L2 penalty, making the loss function differentiable`,
          `B) It is optional — modern autograd frameworks can differentiate through sampling operations directly`,
          `C) It removes the need for a decoder by sampling directly from the prior distribution at inference time`,
          `D) Sampling z ~ N(μ, σ²) is non-differentiable, so the trick rewrites z = μ + σ·ε with ε ~ N(0,1) drawn outside the computation graph — making μ and σ differentiable paths so gradients flow to the encoder`,
        ],
        answer: `D`,
      },
      {
        q: `An autoencoder trained on manufacturing sensor readings is being used for anomaly detection. A maintenance engineer reports that known defective sensors are not flagged. What could cause this and how do you debug?`,
        options: [
          `A) The bottleneck is definitely too small — always increase bottleneck size when known anomalies are not flagged`,
          `B) Known defects not flagged means reconstruction error is low for them — possible causes are training data contamination (defective patterns in training), bottleneck too large (memorisation), low-amplitude defects swamped by MSE on other sensors, or wrong reconstruction metric for the defect type`,
          `C) Autoencoders cannot detect sensor anomalies — use Isolation Forest instead for manufacturing data`,
          `D) The model needs more training epochs — defective patterns are only detected after full convergence`,
        ],
        answer: `B`,
      },
      {
        q: `Compare using a VAE latent space versus using PCA components for anomaly detection. What are the trade-offs?`,
        options: [
          `A) PCA is always better for anomaly detection because it has a closed-form solution and never suffers from training instability`,
          `B) VAE is always better because non-linear manifold structure is universal in real-world sensor data`,
          `C) PCA is fast, interpretable, and works well on approximately Gaussian linear data; VAE captures non-linear manifold structure but requires careful training — use PCA for quick baselines and interpretability, autoencoders/VAEs when normal data has complex non-linear dependencies`,
          `D) They produce identical anomaly scores when the VAE bottleneck size matches the number of PCA components retained`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Autoencoders turn reconstruction failure into an anomaly signal — train on normal data, and anything the decoder cannot reconstruct well is flagged — but only if the bottleneck is sized right: too wide and the model memorizes, too narrow and normal samples also fail.`,
  },
  {
    id: 'gmm',
    interactiveId: 'gmm_viz',
    title: 'Gaussian Mixture Models',
    subtitle: 'EM algorithm, soft assignments, model selection with BIC/AIC',
    difficulty: 'advanced',
    estimatedMin: 38,
    tags: ['GMM', 'EM algorithm', 'probabilistic clustering', 'soft assignment'],
    summary: `K-means has three restrictions baked in that silently cause it to fail: clusters must be spherical, each point belongs to exactly one cluster with certainty, and fit quality is measured by sum of squares. GMM lifts all three at once. Clusters can be elliptical — any orientation, any aspect ratio. Each point belongs to every cluster with some probability (soft assignments). And fit is measured by log-likelihood, which is a principled probabilistic criterion.

The model is a weighted sum of K Gaussian components: p(x) = sum_k π_k N(x | μ_k, Σ_k).

Because the component assignments are latent, direct maximization of log-likelihood is intractable — the EM algorithm solves this by alternating between soft-assigning each point to components (E-step) and updating parameters to maximize expected log-likelihood (M-step). EM is guaranteed to not decrease log-likelihood at each step, but it only reaches a local optimum — multiple restarts are not optional. The covariance type is the key practical decision: full covariance is the most expressive but overfits badly in high dimensions; diagonal covariance is far more robust and is usually the right choice.`,
    keyPoints: [
      `**GMM generative model: to generate one data point, sample a component k with probability π_k (mixing weight), then sample x from N(μ_k, Σ_k).** Parameters to fit: {π_k, μ_k, Σ_k} for

$k=1,...,K. The log-likelihood is L = sum_i log sum_k π_k N(x_i | μ_k, Σ_k). Direct maximization is intractable$

because of the log-sum — EM introduces a latent variable z_i (which component generated x_i) and maximizes a tractable lower bound instead.`,
      `**E-step: compute responsibility r_{ik} = P(z_i=k | x_i, θ) via Bayes' rule: r_{ik} = π_k N(x_i | μ_k, Σ_k) / sum_j π_j N(x_i | μ_j, Σ_j).** Each r_{ik} is in [0,1] and responsibilities for point i sum to 1. This is the soft assignment — point i belongs to component k with probability r_{ik}. K-means is the degenerate version where this is a hard 0/1 assignment to the nearest centroid, which is why k-means's assumptions are visible in the GMM formulation.`,
      `**M-step: update parameters using responsibilities as weighted counts.**

$N_k = sum_i r_{ik}, μ_k = (sum_i r_{ik} x_i) / N_k, Σ_k = (sum_i r_{ik} (x_i − μ_k)(x_i − μ_k)^T) / N_k, π_k = N_k / n.$

All closed-form — no gradient descent. EM guarantees log-likelihood is non-decreasing at each step, but converges to a local optimum that depends on initialization.`,
      `**GMM is a strict generalization of k-means: k-means is the limit of GMM where all Σ_k = σ²I (identical isotropic covariance) and σ→0 (hard assignments).** Relax Σ_k to allow different shapes and orientations, and you get elliptical clusters. Allow soft assignments (σ > 0) and you get probabilistic membership. These two relaxations together are why GMM handles the cases that k-means fails on.`,
      `**Covariance type is the main practical decision: full covariance needs d(d+1)/2 parameters per component — expressive but overfits badly in high dimensions (you need far more samples than parameters).** Diagonal covariance uses d parameters per component and assumes conditional independence between features — much more robust. Spherical (Σ_k = σ_k² I, one parameter per component) is closest to k-means. Match covariance type to the dimensionality and sample size of your data.`,
      `**Model selection with BIC: BIC = −2 log L + p log n (p = number of free parameters).** AIC = −2 log L + 2p. More components always improve log-likelihood — BIC and AIC penalize that by charging for the parameter count. Plot BIC vs K and find the elbow or minimum. BIC penalizes parameters more heavily than AIC (log n vs 2 per parameter), so BIC prefers simpler models and is less likely to overfit on finite samples.`,
      `**Initialization sensitivity: EM converges to the local optimum nearest to the starting parameters.** Degenerate solutions — a component with near-zero covariance that has latched onto one point, or a component that absorbs all the data — are signs of bad initialization or wrong K. Mitigations: initialize with k-means++ centroids, run EM from multiple random starts and keep the result with highest final log-likelihood, or use Bayesian GMM (Dirichlet process prior on mixing weights) to automatically suppress unnecessary components.`,
      `**When GMM beats k-means: you need P(cluster k | point i) for downstream decisions where uncertainty matters (borderline customers in a segmentation, fraud scoring).** Clusters have different shapes, orientations, or densities. You want principled model selection with BIC rather than heuristic elbow plots. The data was genuinely generated by a mixture process. Use k-means when speed and simplicity matter and clusters are roughly spherical.`,
    ],
    checkQuestions: [
      {
        q: `EM for GMM is guaranteed to not decrease log-likelihood at each step, yet it often converges to a poor local optimum. How is this possible?`,
        options: [
          `A) The guarantee is incorrect — EM can decrease log-likelihood when the covariance matrices become singular`,
          `B) EM only guarantees improvement when initialised with k-means++ — random initialisation breaks the monotonicity guarantee`,
          `C) The guarantee is about local monotonicity, not global optimality — the log-likelihood landscape is multimodal and EM hill-climbs to the nearest local maximum from its starting point; run multiple random restarts and keep the highest final log-likelihood`,
          `D) The convergence to poor optima only occurs with diagonal covariance — use full covariance to guarantee global optimality`,
        ],
        answer: `C`,
      },
      {
        q: `You fit a GMM with K=5 and diagonal covariance on 10,000 points in 50 dimensions. BIC keeps decreasing as you increase K from 1 to 20. What does this suggest and what do you do?`,
        options: [
          `A) BIC always decreases monotonically with K — the correct stopping rule is when AIC and BIC disagree`,
          `B) The data genuinely has more than 20 natural groups — always continue increasing K until BIC starts increasing`,
          `C) Switch to full covariance — diagonal covariance is causing BIC to underestimate the penalty term`,
          `D) Either the true cluster count exceeds 20, or outliers/non-Gaussianity require many components to approximate — try dimensionality reduction (PCA to 10-15 components) before GMM, remove outliers, or consider HDBSCAN if the Gaussian assumption is violated`,
        ],
        answer: `D`,
      },
      {
        q: `A customer segmentation GMM has a component with mixture weight π_k = 0.001 that collapses to a tiny covariance (singular matrix). What happened and how do you fix it?`,
        options: [
          `A) This is normal behaviour — components with small mixture weights always have small covariances by definition`,
          `B) The component has latched onto one or a few isolated points and driven its covariance to zero to maximise those points' likelihood — fix by adding covariance regularisation, using Bayesian GMM, re-initialising with k-means++, or reducing K`,
          `C) Increase the number of EM iterations — degenerate components resolve themselves with more training`,
          `D) Switch to full covariance — diagonal covariance always produces degenerate components when mixture weights are small`,
        ],
        answer: `B`,
      },
      {
        q: `How do you use GMM for density estimation and anomaly detection? What determines the anomaly threshold?`,
        options: [
          `A) GMM anomaly detection requires labelled anomalies to set the threshold — it cannot operate unsupervised`,
          `B) Use the number of mixture components as the threshold — points assigned to components with fewer than 5% mixture weight are anomalies`,
          `C) After fitting, compute log p(x) = log sum_k π_k N(x|μ_k, Σ_k) per sample; flag samples with very low log-likelihood; set threshold by percentile (expected contamination rate), validation against labelled anomalies, or decision-cost balancing`,
          `D) GMM density estimation only works for anomaly detection when K=1 — multiple components make the threshold ambiguous`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `GMM lifts three k-means restrictions at once — soft assignments, elliptical clusters, log-likelihood as the fit criterion — but EM only finds a local optimum, so run multiple restarts and use BIC to choose K.`,
    interactiveId: 'gmm_viz',
  },
  {
    id: 'anomaly_detection',
    interactiveId: 'anomaly_detection_viz',
    title: 'Anomaly Detection',
    subtitle: 'Isolation Forest, one-class SVM, LOF, autoencoder-based, evaluation without labels',
    difficulty: 'intermediate',
    estimatedMin: 40,
    tags: ['anomaly detection', 'isolation forest', 'outlier', 'one-class'],
    summary: `Labelled anomaly data is almost never available in sufficient quantity — fraud is rare, defects are rare, intrusions are rare — which means you cannot use standard supervised classification. Every anomaly detection algorithm is instead a different definition of "unusual" encoded as math. Statistical methods say unusual means low probability under a fitted distribution. LOF says unusual means sparser than your neighbors. Isolation Forest says unusual means easy to isolate with random cuts — an outlier needs fewer splits to be alone in a leaf than a normal point does. Autoencoders say unusual means hard to reconstruct from compressed form. Pick the algorithm whose definition matches the structure of the anomalies you expect. Evaluation is the hard part: labelled anomalies are rare, expensive to collect, and the ones you have may not represent future anomaly types. In production you often end up relying on expert review of top-k flagged samples, downstream business metrics, and synthetic injection tests — not clean precision/recall curves.`,
    keyPoints: [
      `**Isolation Forest: builds many random trees.** At each node, pick a random feature and a random split between min and max. Repeat until each point is isolated in its own leaf. Anomalies are "few and different" — they need fewer splits to isolate than normal points, so their average isolation depth across trees is smaller. Anomaly score is the mean isolation depth, normalized by the expected depth of a random sample from a uniform distribution. O(n log n) to train and score. Handles high dimensions better than density-based methods and makes no distributional assumptions.`,
      `**Local Outlier Factor (LOF): estimate local density for each point as the inverse of mean reachability distance to its k nearest neighbors.** LOF(i) = mean density of neighbors / density of i. LOF near 1 means the point is as dense as its surroundings — normal. LOF well above 1 means the point is sparser than its neighbors — locally anomalous. This local normalization is the key feature: a point in a globally sparse region still gets LOF near 1 if its neighbors are equally sparse. The practical ceiling: O(n²) computation makes LOF infeasible for n above 100,000.`,
      `**One-class SVM: learns a tight boundary around the training data (hypersphere in input space, hyperplane in kernel space).** Points outside are anomalies. The ν parameter sets the upper bound on the fraction of training points allowed outside the boundary — effectively the expected contamination rate. RBF kernel enables non-linear boundaries around complex normal distributions. Downsides: very sensitive to feature scaling (standardize first), O(n²) to O(n³) training time, outputs a binary label rather than a continuous anomaly score — useless when you need to rank anomalies by severity.`,
      `**Statistical methods: if normal data is approximately Gaussian in low dimensions (≤ 20 features), fit a multivariate Gaussian and use Mahalanobis distance as the anomaly score — points beyond the χ² 99th percentile threshold are flagged.** For multimodal normal data, use a GMM and threshold on log p(x). Statistical methods are the most interpretable option: you can explain exactly which feature combination caused a high score. They break when the Gaussian assumption fails badly (heavy tails, discrete distributions, strong non-linearity).`,
      `**Evaluation without labels: in most production systems, ground truth is absent.** Practical strategies: precision/recall on a small labelled set (200-500 expert-labelled examples go a long way for setting thresholds). Expert review of top-k — have domain experts classify the top 50 flagged samples; Precision@50 is a useful operating metric. Downstream business metric — does blocking flagged transactions reduce fraud losses? Injection testing — seed synthetic anomalies with known properties into the stream and measure recall (only valid if the synthetics match real anomaly structure).`,
      `**Semi-supervised anomaly detection: when you have labelled normal examples but near-zero labelled anomalies, train exclusively on normals (Deep SVDD, PatchCore, OC-NN).** The model learns a compact representation of normal patterns; at inference, anomalies fall outside that compact region. Better than fully unsupervised because the model learns your specific definition of normal rather than inferring it from data that may be contaminated with unlabelled anomalies.`,
      `**Time-series anomaly types: point anomalies (a single timestamp is anomalous), contextual anomalies (a value is normal globally but anomalous given the surrounding context — a high temperature reading in winter), and collective anomalies (a subsequence is anomalous as a pattern even if no individual point is unusual).** Isolation Forest misses contextual and collective anomalies — it treats each point independently. LSTM or transformer autoencoders that reconstruct sequences capture temporal context and handle all three types.`,
      `**Contamination parameter and calibration: every anomaly detection method needs a decision threshold, often expressed as the expected contamination fraction τ.** Isolation Forest uses τ to set the threshold on anomaly score. τ too high → too many false positives flooding the review queue. τ too low → real anomalies get missed. Set τ from domain knowledge (known fraud rate, expected defect rate), then sweep it over a range and evaluate precision at different operating points against your operational capacity. Contamination calibration is the single most impactful hyperparameter decision in anomaly detection deployment.`,
    ],
    checkQuestions: [
      {
        q: `You are detecting network intrusion anomalies from 1 million log events per day with 200 features. Which method do you choose and why?`,
        options: [
          `A) LOF — it detects local density anomalies which are most common in network intrusion patterns`,
          `B) One-class SVM with RBF kernel — it learns a non-linear boundary around normal traffic that handles the high feature count well`,
          `C) Isolation Forest — O(n log n) training and O(log n) scoring makes it feasible at 1M events/day with 200 features; handles high dimensions better than LOF (O(n²)) or one-class SVM (O(n²-n³)); use LSTM autoencoder if temporal sequence patterns matter for contextual anomalies`,
          `D) Mahalanobis distance on a fitted multivariate Gaussian — the most interpretable option for explaining detected intrusions to security teams`,
        ],
        answer: `C`,
      },
      {
        q: `LOF detects an anomaly in a dataset with two clusters of very different sizes and densities. A point in the smaller, denser cluster gets LOF=0.9 (classified as normal). A point at the edge of the larger, sparser cluster gets LOF=1.8 (classified as anomaly). Is this correct behaviour?`,
        options: [
          `A) No — the point in the dense small cluster should have a high LOF because the cluster is unusual relative to the global data distribution`,
          `B) No — LOF should be calibrated relative to global density, not local neighbourhood density`,
          `C) No — LOF=0.9 indicates a numerical error; LOF values cannot be below 1 for any point`,
          `D) Yes — LOF is locally normalised by design; the dense-cluster point is normal relative to its equally-dense neighbours (LOF≈1), while the sparse-cluster edge point is sparser than its denser-core neighbours (LOF>1), which is the correct semantic`,
        ],
        answer: `D`,
      },
      {
        q: `Your Isolation Forest model is flagging 15% of transactions as anomalies, but the fraud team says the actual fraud rate is 0.5%. What do you change?`,
        options: [
          `A) Increase n_estimators from 100 to 500 — more trees reduce the false positive rate`,
          `B) Set contamination=0.005 to align with the 0.5% fraud rate, which shifts the decision threshold to the 99.5th percentile of training anomaly scores; sweep contamination from 0.001 to 0.01 and calibrate against labelled fraud cases and the team's review capacity`,
          `C) Switch to LOF — Isolation Forest is known to have high false positive rates at low fraud rates`,
          `D) Reduce max_samples per tree — smaller subsamples reduce over-sensitivity and lower the false positive rate`,
        ],
        answer: `B`,
      },
      {
        q: `You have 1,000 labelled normal samples and 0 labelled anomalies. How do you build and evaluate an anomaly detection model?`,
        options: [
          `A) You cannot build an anomaly detection model without labelled anomalies — collect anomaly labels first`,
          `B) Train a supervised binary classifier using synthetic anomalies as the negative class`,
          `C) Use a one-class SVM which requires only normal samples, and evaluate by checking that its boundary tightly encircles all training points`,
          `D) Train Isolation Forest or autoencoder exclusively on normal samples; evaluate via synthetic anomaly injection (uniform samples from feature bounding box), expert review of top-k flagged samples (Precision@50), and collect confirmed incidents in the first month of production to build a labelled set for retraining`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Each anomaly detection algorithm is a definition of "unusual" encoded as math — pick the one whose definition matches the anomalies you expect, because Isolation Forest will miss contextual anomalies just as surely as LOF will miss them in large datasets.`,
    interactiveId: 'anomaly_detection_viz',
  },
  {
    id: 'topic_modeling',
    title: 'Topic Modeling',
    subtitle: 'LDA mechanics, NMF, choosing K, coherence vs perplexity, production limits',
    difficulty: 'intermediate',
    estimatedMin: 38,
    tags: ['topic modeling', 'LDA', 'NMF', 'NLP'],
    summary: `You have ten thousand documents and need to understand what they are about without reading them. Topic modeling addresses this by discovering latent themes: each document is modeled as a mixture over topics, each topic as a distribution over words. LDA is the standard approach — Dirichlet priors enforce sparsity so most documents focus on a few topics and each topic has a few characteristic words. You never observe which topic generated which word — inference recovers the latent topics from word co-occurrence patterns. NMF attacks the same problem differently: decompose the term-document matrix V ≈ W × H with non-negativity constraints, producing word groups that are interpretable additive parts. Choosing K is the central practical problem, and the standard statistical metric — perplexity on held-out data — is wrong for it: perplexity almost always improves as K grows and has essentially no relationship to human interpretability. Coherence (whether top words within a topic actually co-occur in real text) is the right metric — but the only true ground truth is a domain expert who can label each topic with a meaningful name without hedging.`,
    keyPoints: [
      `**LDA generative process: for each document d, draw topic proportions θ_d ~ Dirichlet(α).** For each word position, draw topic z ~ Categorical(θ_d), then draw word w ~ Categorical(φ_z) where φ_z ~ Dirichlet(β) is the topic-word distribution. Small α means documents use few topics; small β means each topic uses few words. Exact inference of θ and φ is intractable — use variational EM or collapsed Gibbs sampling.`,
      `**NMF: decompose the term-document matrix V (D×V) as V ≈ W (D×K) × H (K×V) with W, H ≥ 0.** W_{dk} is the weight of topic k in document d; H_{kv} is the weight of word v in topic k. Non-negativity forces parts-based additive representations — documents are sums of topic contributions, topics are sums of word contributions. On short texts (tweets, reviews), NMF with TF-IDF input often produces more coherent topics than LDA because TF-IDF already suppresses common words and the parts constraint naturally produces sparse, focused groups.`,
      `**Perplexity vs coherence for choosing K: perplexity measures how well the model predicts held-out words — lower is better fit.** More topics almost always lowers perplexity, making it useless as a selection criterion because it keeps improving past the point where topics become incoherent. Coherence (NPMI between top-10 words of each topic, averaged across topics) measures whether grouped words actually co-occur in real text. Coherence peaks at some K and then degrades as topics fragment. Choose K by maximizing coherence.`,
      `**NPMI coherence: for top words w₁,...,wₙ of a topic, NPMI(w_i, w_j) = log[P(w_i, w_j)/P(w_i)P(w_j)] / −log P(w_i, w_j).** Range [-1, 1]: 1 means the words always co-occur, 0 means independent, -1 means they never co-occur. Average NPMI over all word pairs in a topic gives topic coherence; average over all topics gives corpus coherence. Compute co-occurrence probabilities on an external reference corpus (Wikipedia) rather than the training corpus — using training data can inflate coherence for topics the model has overfit to.`,
      `**Preprocessing is the biggest lever on topic quality: lemmatize (running → run, models → model) to consolidate word forms.** Remove stop words — common function words appear everywhere and dilute every topic. Set a minimum document frequency (words in fewer than 5 documents are noise). Detect bigrams with Gensim's Phrases and add machine_learning, neural_network as single tokens. Use TF-IDF input for NMF; raw word counts for LDA (the Dirichlet model expects raw counts). Poor preprocessing produces topics dominated by generic vocabulary regardless of K or algorithm.`,
      `**Production limitations: LDA with Gibbs sampling is non-deterministic — topics change order and content between runs.** Fix with a fixed random seed, or run 5 seeds and keep the run with highest coherence. New documents about emerging topics get forced into the nearest existing topic — the model cannot create new topics at inference time. For large corpora, Gibbs sampling is O(n_words × K × n_iterations) — use online VB LDA (Hoffman et al. 2010) which processes mini-batches. Retrain periodically or use dynamic topic models to handle topic drift as the corpus changes.`,
      `**BERTopic: encode documents with sentence-BERT, reduce to 5-d with UMAP, cluster with HDBSCAN, then represent each cluster with class-based TF-IDF (c-TF-IDF) — the words that best distinguish one cluster from all others.** Advantages: semantically richer topics, better handling of short texts, K is inferred by HDBSCAN rather than manually chosen, and topic evolution over time can be tracked. Limitation: less interpretable as a generative model (no document-topic probabilities), GPU required for large-scale embedding.`,
      `**Practical evaluation: present the top-10 words for each topic to a domain expert and ask them to assign a label.** Track the fraction of topics that receive a coherent label. A model with coherence 0.55 where every topic is labelable beats a model with coherence 0.60 where half are labelled "miscellaneous." Also check document coverage — are all documents concentrated in a few topics, leaving the rest nearly empty? That signals K is too high or preprocessing left too much noise.`,
    ],
    checkQuestions: [
      {
        q: `You train LDA with K=10 topics but the coherence score is low — words within each topic are not semantically related. List 3 concrete things to try.`,
        options: [
          `A) Increase training iterations, use a larger vocabulary, and switch from Gibbs sampling to variational EM`,
          `B) Improve preprocessing (add bigrams, extend stop words, raise minimum document frequency), plot coherence vs K from 2 to 30 to find the peak, and switch to NMF with TF-IDF if short texts are dominant`,
          `C) Increase K to 20 — incoherence at K=10 always means the number of topics is set too low`,
          `D) Decrease the α hyperparameter to force sparser document-topic distributions, which always improves coherence`,
        ],
        answer: `B`,
      },
      {
        q: `A document about "machine learning in healthcare" has LDA topic proportions: topic 3 (medicine) = 0.45, topic 7 (ML) = 0.40, topic 1 (other) = 0.15. How do you use this for document retrieval vs document categorisation?`,
        options: [
          `A) For both retrieval and categorisation assign the document to its highest-proportion topic (medicine) — the soft proportions are only used to set a confidence score`,
          `B) For retrieval represent the document as a topic vector and use cosine similarity to find documents with similar proportions; for categorisation the soft vector feeds a supervised classifier rather than a hard argmax`,
          `C) Soft topic proportions are only valid for retrieval when all proportions are above 0.1; below that threshold use hard assignment`,
          `D) LDA topic proportions cannot be used for retrieval — use TF-IDF cosine similarity instead and reserve LDA output for categorisation only`,
        ],
        answer: `B`,
      },
      {
        q: `You find that the top 10 words for 3 out of 10 LDA topics are nearly identical (all contain "data", "model", "analysis", "result", "method"). What does this indicate?`,
        options: [
          `A) The three topics are capturing genuine sub-disciplines of methodology that happen to share vocabulary`,
          `B) K is set too low — increase K so each topic can specialise further`,
          `C) The Dirichlet α hyperparameter is too large, causing topics to share too many words`,
          `D) Generic methodology vocabulary was not removed from the vocabulary — add high-document-frequency words ("data", "model", "method") to the stop list; also reduce K as the model is carving one underlying topic into three near-duplicate versions`,
        ],
        answer: `D`,
      },
      {
        q: `What is the difference between perplexity and coherence as metrics for LDA? Why do they sometimes disagree about the optimal K?`,
        options: [
          `A) They measure the same thing with different scales — disagreement indicates a bug in the coherence calculation`,
          `B) Perplexity measures human interpretability and coherence measures statistical fit — use perplexity for production and coherence for academic evaluation`,
          `C) Coherence is only valid when computed on the training corpus — using an external reference corpus like Wikipedia causes it to disagree with perplexity`,
          `D) Perplexity is a generative fit metric that always improves with more topics; coherence is a human-interpretability proxy that peaks at moderate K then degrades as topics fragment — they optimise different objectives and coherence is the right metric for topic modeling's primary use case`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Statistical fit (perplexity) and human interpretability (coherence) measure different things and disagree about the optimal K — a topic model can score well on one while failing completely on the other, and the only test that actually matters is whether domain experts can label every topic with a meaningful name.`,
  },
]
