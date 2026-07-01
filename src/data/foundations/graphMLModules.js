export const GRAPH_ML_MODULES = [
  {
    id: 'graph_representations',
    interactiveId: 'gnn_message_passing_viz',
    title: 'Graphs as ML Data Structures',
    subtitle: 'Adjacency formats, task types, permutation invariance, homophily, inductive vs transductive',
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['graph', 'adjacency', 'CSR', 'homophily', 'permutation invariance', 'transductive'],
    interactivePrompt: `Before you touch the controls: a fraud detection system has 50 million users as nodes and 500 million transactions as edges. A user who received money from 5 known fraud accounts last week is a high-risk signal — but only if you can see the graph. What would a standard feature vector per user miss, and why?`,
    summary: `A fraud detection system has 50 million users and 500 million transactions. A user who received money from 5 confirmed fraud accounts last week is almost certainly a fraud risk. But your ML model takes a feature vector per user — age, account balance, transaction volume. None of those features capture "connected to known fraudsters." The signal is real, it is strong, and it is invisible unless you model the graph structure. This is why graph ML exists.

Graphs appear wherever relationships between entities carry information: molecular property prediction (atoms as nodes, bonds as edges), citation networks (papers as nodes, citations as edges), knowledge graphs (entities as nodes, relations as edges), social recommendations. In each case, the graph structure encodes relational signals that a per-node feature vector cannot represent. Graph ML extracts that signal.

Before any model runs, you need the right data structure. A 50M-node social graph stored as a dense adjacency matrix requires 50M × 50M entries at 1 bit each: 312 terabytes. Stored as a CSR (Compressed Sparse Row) sparse matrix with only the 500M actual edges, it requires about 40 gigabytes. This is not a detail — it is the difference between a system that is buildable and one that is not.

Beyond data structures, graph tasks split into three types. Node-level tasks (fraud detection, protein function prediction) require a prediction per node, using each node's final embedding directly. Edge-level tasks (link prediction, drug-target interaction) require a prediction per edge, typically from a decoder applied to the two endpoint embeddings. Graph-level tasks (molecular property prediction) require one prediction for the entire graph, using a readout function that aggregates all node embeddings into a fixed-size vector.

**NOT this.** "Graphs are just for network analysis." Graphs appear wherever entities have relationships that carry information: molecular property prediction where the graph is a molecule, recommendation systems where the graph connects users to items, knowledge graphs that power QA systems, traffic routing where roads are edges. Any problem with entities and relations between them is potentially a graph problem. The question is whether the relational structure contains signal that a per-entity feature vector would miss — and in most domains, it does.`,
    keyPoints: [
      `**Dense adjacency matrix A ∈ {0,1}^{NxN}: stores all N\xb2 entries regardless of edge count.** O(N\xb2) memory. Efficient only for dense graphs (|E| ≈ N\xb2). For a social graph with N=50M nodes: 50M\xd750M = 2.5\xd710^{15} entries, ~312 TB even at 1 bit per entry. GCN on full adjacency requires O(N\xb2) memory even at inference. Never use for large sparse graphs.`,
      `**CSR (Compressed Sparse Row): stores only nonzero entries in three arrays — values (edge weights), col_indices (column of each entry), row_ptr (start of each row in col_indices).** Memory O(|E| + |V|). For a 50M-node graph with 5B edges: ~40 GB. SpMM (sparse \xd7 dense matrix multiply) is the core GNN operation — PyTorch Geometric and DGL both build on this. Message passing on CSR is naturally parallel across edges, which maps directly to GPU execution.`,
      `**Node-level, edge-level, and graph-level tasks require fundamentally different output structures.** Node-level (fraud detection, protein function): each node gets a prediction, using the node's final embedding directly. Edge-level (link prediction, knowledge graph completion): each edge gets a prediction, typically from a decoder applied to the two endpoint embeddings. Graph-level (molecular property, circuit quality): the entire graph gets a prediction, requiring a readout function that aggregates all node embeddings into a fixed-size vector.`,
      `**Standard NNs cannot be applied to graphs for two reasons: variable input size (graphs differ in |V| and |E|), and no canonical node ordering — the same node appears at index 3 in one ordering and index 87 in another.** Permutation invariance requires f(PAP^T, Px) = f(A, x) for any permutation matrix P. An MLP applied to a flattened adjacency matrix is not permutation invariant — different orderings of the same graph produce different outputs.`,
      `**Graph signal processing gives structural intuition: node features are signals on the graph.** The graph Laplacian L = D - A captures discrete gradient structure. Multiplying by L computes the difference between each node's feature and its neighbors' mean — a high-pass filter that amplifies differences. GCN aggregation with self-loops is a low-pass filter that smooths features across edges. Stacking too many GCN layers over-smooths features to the point where all nodes become indistinguishable.`,
      `**Homophily vs heterophily determines whether mean aggregation helps or hurts.** In homophilic graphs (social networks — connected nodes have similar properties), standard GNNs that average neighbor features work well because neighbors have informative features. In heterophilic graphs (fraud ring members connect to victims, bipartite recommendation graphs), mean aggregation destroys the discriminative signal because the fraudster's neighbors are predominantly legitimate. H2GCN addresses this by keeping the ego node's embedding separate from aggregated neighbor features.`,
      `**Inductive vs transductive is an architectural commitment with production consequences.** Transductive GNNs (spectral methods, vanilla GCN) train and test on the same fixed graph — they cannot generate embeddings for unseen nodes without retraining. In production, new users and items arrive continuously. GraphSAGE, GAT, and spatial methods learn aggregation functions that apply to any neighborhood, making them inductive by design. Anything requiring full graph retraining to embed new nodes is not deployable.`,
      `**Heterogeneous graphs are the production default.** Multiple node types (user, item, category) and edge types (click, purchase, co-viewed) are the norm in e-commerce and knowledge graphs. Homogeneous GNNs that ignore type information discard the relational semantics that distinguish a click from a purchase — which are often the most commercially important signals. Modeling heterogeneity is not an advanced feature; ignoring it is a lossy baseline.`,
    ],
    checkQuestions: [
      {
        q: `You have a social network with 50M users and 5B edges. Explain concretely why you cannot use a standard dense adjacency matrix, and what data structure you would use instead.`,
        options: [
          `A) Dense adjacency would work but is slow; use a hash map from node pairs to edge weights for faster lookup`,
          `B) Dense adjacency requires 50M\xd750M = 2.5\xd710^15 entries (~312 TB even at 1 bit per entry) — infeasible; use CSR (stores only 5B edges, ~40 GB), which maps naturally to SpMM operations in PyTorch Geometric and supports distributed graph partitioning`,
          `C) Dense adjacency is fine for 50M nodes if stored on a distributed file system — the storage limit is not a practical concern at this scale`,
          `D) Use a dense adjacency matrix but restrict training to 1% of nodes via random sampling to reduce memory to a manageable size`,
        ],
        answer: `B`,
      },
      {
        q: `Explain what permutation invariance means for a graph neural network, and show why a 2-layer MLP applied to the flattened adjacency matrix is not permutation invariant.`,
        options: [
          `A) Permutation invariance means the network produces the same output regardless of node feature values; MLP is not invariant because it is sensitive to feature magnitude`,
          `B) Permutation invariance means f(PAP^T, PX) = f(A, X) for any permutation P; an MLP on flattened A is not invariant because two different node orderings of the same graph produce different 1D vectors, giving different outputs from the same model`,
          `C) MLPs are permutation invariant as long as the input features are L2-normalized before flattening`,
          `D) Permutation invariance is only required for graph-level tasks; node-level MLPs are exempt because each node has a fixed position in the feature matrix`,
        ],
        answer: `B`,
      },
      {
        q: `Your GNN for citation network node classification achieves 85% accuracy with 2 layers, but drops to 60% with 8 layers. What is happening and how do you fix it?`,
        options: [
          `A) 8-layer GNNs require larger learning rates to converge; the accuracy drop is a training stability issue, not a structural one`,
          `B) Over-smoothing: each GCN layer applies a low-pass filter, and after 8 layers node embeddings converge to nearly the same vector (weighted average of the full 8-hop neighborhood); fixes include residual connections, JK-Net (concatenate all layer outputs), or limiting depth to 2-4 layers`,
          `C) 8 layers cause the model to overfit — reduce model capacity by cutting the hidden dimension in half`,
          `D) The citation network is too small for 8-layer GNNs; this architecture requires graphs with millions of nodes`,
        ],
        answer: `B`,
      },
      {
        q: `Why do standard GNNs fail on heterophilic graphs, and name a method that handles them?`,
        options: [
          `A) Standard GNNs fail on heterophilic graphs because they cannot process graphs with more than 2 node types`,
          `B) Standard GNNs aggregate neighbor features via mean/sum — in heterophilic graphs, neighbors have different labels and their averaged features destroy the ego node's discriminative signal; H2GCN handles this by keeping ego embedding separate from neighbor aggregations and concatenating 1-hop and 2-hop neighborhoods separately`,
          `C) Standard GNNs fail on heterophilic graphs because they require the graph to be symmetric (undirected)`,
          `D) Heterophilic graphs are handled by all GNNs equally well — performance differences are due to feature quality, not architecture`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The constraint that makes GNNs fundamentally different from every other neural network is permutation invariance — the same graph admits N! adjacency matrix representations, so any valid GNN must aggregate neighbor features with a permutation-invariant function (sum, mean, max). Everything else in GNN design follows from this constraint. In production, the adjacency matrix format is not a detail: for a 50M-node social graph, the choice between dense (312 TB) and CSR (~40 GB) determines whether the system is buildable at all.`,
  },
  {
    id: 'spectral_gcn',
    interactiveId: 'gnn_message_passing_viz',
    title: 'Spectral Graph Convolution',
    subtitle: 'Graph Laplacian, ChebNet, Kipf & Welling GCN, renormalization trick, transductive limitation',
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['spectral', 'Laplacian', 'ChebNet', 'GCN', 'eigendecomposition', 'graph signal processing'],
    interactivePrompt: `Before you touch the controls: a citation network has 2708 papers and 7 subject fields. Each paper has 1433 binary word-presence features. A naive MLP on those features achieves 56% field classification accuracy. What signal is the MLP missing, and how could aggregating information from a paper's citations improve accuracy?`,
    summary: `A citation network has 2708 papers across 7 fields — machine learning, databases, and five others. Each paper has 1433 binary features encoding word presence. A plain MLP on those features achieves 56% accuracy at field classification. The problem: a paper's field is determined not just by its own words but by what it cites and who cites it. Machine learning papers cite other machine learning papers. The graph structure carries signal the MLP ignores.

Standard convolution is defined for regular grids — the same kernel slides over every pixel position. Graphs have no grid, no canonical node ordering, and variable neighborhood sizes. You cannot slide a fixed-size kernel over a graph. Spectral methods provided the first principled definition of graph convolution by grounding it in signal processing: the graph Laplacian L = D - A acts as the frequency operator, and filtering in spectral space multiplies signal components in eigenspace.

The problem is that eigendecomposition of the Laplacian costs O(N\xb3) — infeasible for any real graph. ChebNet avoids explicit eigendecomposition by approximating spectral filters with Chebyshev polynomials of degree K, reducing convolution to sparse matrix multiplications that scale with edge count. Kipf & Welling (2017) simplified further to K=1 with a self-loop trick, giving one sparse matrix multiply per layer: H^{(l+1)} = σ(D̃^{-1/2} Ã D̃^{-1/2} H^{(l)} W^{(l)}). This GCN achieves 81% accuracy on the citation network versus 56% for the feature-only MLP — the graph structure accounts for 25 percentage points of accuracy.

But spectral GCNs carry a fundamental limitation that no hyperparameter can fix: the learned filter weights are defined in the eigenspace of a specific graph's Laplacian. A new graph has a different Laplacian with different eigenvectors. The model cannot generalize. This is why every production GNN system uses spatial methods.

**NOT this.** "GCN is just convolution applied to graphs." Image convolution is defined for regular grids with fixed-size neighborhoods — the same kernel applies at every position because the grid is uniform. Graph convolution operates on irregular, variable-size neighborhoods with no canonical ordering. The spectral formulation connected graph operations to signal processing theory, but it gave way to spatial formulations because spectral filters cannot transfer to new graphs. Spatial message-passing GNNs — which aggregate over explicit neighborhoods — generalize inductively. Spectral GCNs do not.`,
    keyPoints: [
      `**Graph Laplacian: L = D - A where D is the diagonal degree matrix.** Normalized: L̃ = D^{-1/2} L D^{-1/2} = I - D^{-1/2} A D^{-1/2}. Eigendecomposition: L = UΛU^T, columns of U are eigenvectors, Λ diagonal with eigenvalues λᵢ ∈ [0, 2]. The eigenvectors form the graph Fourier basis — analogous to Fourier basis functions for regular grids, but dependent on the specific graph topology.`,
      `**Spectral filtering requires eigendecomposition first: x̂ = U^T x (graph Fourier transform), apply filter ĝ(Λ) pointwise to eigenvalues, inverse transform x = Ux̂.** The full pipeline costs O(N\xb3) for decomposition plus O(N\xb2) to store U. At N=10,000 nodes: already expensive. At N=1M: completely infeasible. The solution is polynomial approximation — if ĝ(λ) = Σ_k θ_k λ^k, then U ĝ(Λ) U^T = Σ_k θ_k L^k, reducing convolution to sparse matrix multiplications that never require U.`,
      `**ChebNet (Defferrard et al., 2016): approximate spectral filters with Chebyshev polynomials T_k(λ̃) where λ̃ = 2λ/λ_max - 1 ∈ [-1,1].** K-th order ChebNet considers K-hop neighborhoods — wider than K=1 but still local. Chebyshev polynomials are chosen for numerical stability (min-max optimal approximation) and efficient recurrence T_k(x) = 2xT_{k-1}(x) - T_{k-2}(x), avoiding explicit computation of eigenvectors entirely.`,
      `**Kipf & Welling GCN (2017): simplify ChebNet to K=1 (first-order), approximate λ_max ≈ 2.** This collapses the two-parameter filter to a single parameter per feature. Adding self-loops (Ã = A + I) before normalization gives the propagation rule: H^{(l+1)} = σ(D̃^{-1/2} Ã D̃^{-1/2} H^{(l)} W^{(l)}). A single sparse matrix multiply per layer — tractable on large graphs. The simplification was what made GCNs widely adopted.`,
      `**Renormalization trick: adding self-loops (A → A + I = Ã) before degree normalization prevents numerical instability for degree-zero nodes and ensures each node's own features contribute to its update.** Without self-loops, an isolated node receives a zero vector regardless of its features. The trick also shifts the spectral range to approximately [0,1], improving gradient flow through deep networks.`,
      `**Spectral methods cannot transfer to new graphs.** The learned filter weights are defined in terms of polynomial coefficients applied to L — and L is specific to the training graph. A new graph has a different L with different eigenvectors. Even though ChebNet doesn't explicitly compute eigenvectors, its polynomial coefficients were optimized for the specific spectral profile of the training graph. Inference on a new graph produces meaningless results. PinSage at Pinterest uses spatial methods for exactly this reason.`,
      `**Over-smoothing from a spectral perspective: each GCN layer applies D̃^{-1/2} Ã D̃^{-1/2}, a low-pass filter with eigenvalues in [0,1].** With L layers, eigenvalues are raised to the L-th power — high-frequency components (small eigenvalues) vanish exponentially, leaving only the dominant eigenvector, which corresponds to the stationary distribution of the graph's random walk. After many layers, all node embeddings converge to a constant times the degree sequence, losing all discriminative power.`,
      `**Even the first-order approximation requires the full adjacency matrix for the matrix-vector product ÃH at each layer.** Mini-batching requires carefully handling multi-hop neighborhoods to avoid the neighbor explosion problem — not naturally addressed by spectral formulations. This is another reason spatial methods dominate production: neighbor sampling (GraphSAGE) and subgraph sampling (GraphSAINT) require explicit neighborhood control that spectral methods don't support.`,
    ],
    checkQuestions: [
      {
        q: `Derive the GCN propagation rule from spectral filtering. Why does Kipf & Welling set K=1 and approximate λ_max=2?`,
        options: [
          `A) K=1 is set to limit the receptive field to 1 hop; λ_max=2 is the exact maximum eigenvalue of any normalized Laplacian`,
          `B) Start from ChebNet K=2, set θ₀=-θ₁=θ, add self-loops (Ã=A+I), normalize with D̃ — this yields H^{l+1} = σ(D̃^{-1/2}ÃD̃^{-1/2} H^l W^l); K=1 reduces parameters and overfitting; λ_max≈2 is an approximation that avoids computing the exact spectral radius per graph`,
          `C) K=1 is the minimum value that enables multi-hop aggregation; λ_max=2 is set empirically based on ImageNet benchmarks`,
          `D) λ_max=2 is exact for all graphs by definition of the normalized Laplacian; K=1 is chosen because higher orders provide no additional expressiveness`,
        ],
        answer: `B`,
      },
      {
        q: `A teammate proposes to train a spectral GCN on a protein-protein interaction network and then apply it to a new PPI network with different proteins. What is the fundamental problem and how do you fix it?`,
        options: [
          `A) The problem is different node feature dimensions between networks; fix by padding features to the same dimension`,
          `B) Spectral GCN filters are defined in the eigenspace of the training graph's Laplacian; the new graph has a different Laplacian with different eigenvectors — the filter literally cannot transfer; fix by switching to a spatial/message-passing GNN (GraphSAGE, GAT) that learns aggregation functions over neighborhoods, not eigenspace`,
          `C) The problem is that PPI networks are too dense for spectral methods; use a sparse subsampling strategy before training`,
          `D) There is no fundamental problem — spectral GCN polynomial coefficients transfer across graphs because they are graph-agnostic scalars`,
        ],
        answer: `B`,
      },
      {
        q: `What is over-smoothing in GCNs, and what is its formal spectral interpretation?`,
        options: [
          `A) Over-smoothing is when a GCN memorizes training node features; spectral interpretation is that the training loss converges to a degenerate minimum`,
          `B) Over-smoothing: all node embeddings converge to the same vector after many layers; spectral interpretation: each GCN layer applies a low-pass filter with eigenvalues in [0,1]; raising them to the L-th power makes high-frequency components vanish exponentially, leaving only the dominant eigenvector (the random walk stationary distribution) — all nodes look alike`,
          `C) Over-smoothing occurs only in heterophilic graphs; in homophilic graphs deep GCNs always improve with more layers`,
          `D) Over-smoothing is a gradient vanishing problem; its spectral interpretation is that small eigenvalues cause gradients to become zero before reaching the lower layers`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The Kipf & Welling GCN is a first-order Chebyshev polynomial approximation that avoids eigendecomposition — this is what made spectral GCNs tractable. But the approximation doesn't fix the transductive limitation: spectral filters are defined in the eigenspace of a specific graph's Laplacian and cannot transfer to graphs not seen during training. This is why all production GNN systems use spatial message-passing methods — inductive generalization to new nodes and graphs is a hard requirement, not an optimization, and spectral methods cannot satisfy it.`,
  },
  {
    id: 'spatial_gcn',
    interactiveId: 'gnn_message_passing_viz',
    title: 'Spatial & Message-Passing GCNs',
    subtitle: 'GraphSAGE, neighbor sampling, aggregators, inductive learning, scalability',
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['GraphSAGE', 'message passing', 'neighbor sampling', 'inductive', 'aggregation', 'scalability'],
    interactivePrompt: `Before you touch the controls: Pinterest has 3 billion pins and new pins arrive every second. A spectral GCN trained on yesterday's graph cannot embed today's new pins without retraining. What architectural change would allow you to embed a brand-new pin — one that wasn't in the training graph — using only its features and its connections to existing pins?`,
    summary: `Pinterest has 3 billion pins and 18 billion edges. New pins arrive every day. A spectral GCN requires the full adjacency matrix during training — it learns embeddings tied to the specific graph. Add a new pin and the model cannot embed it without retraining from scratch. At Pinterest's scale, that is not a deployment model.

GraphSAGE reframes the problem. Instead of learning fixed embeddings for each node, it learns aggregation functions — parameterized operations that map any neighborhood to an embedding. The same learned function applies to nodes never seen during training. Give it a new pin's features and its neighbors' features, run the aggregation, and you get an embedding in milliseconds. No retraining. This inductivity — generalizing to new nodes without retraining — is the architectural property that makes billion-scale GNN deployment possible.

The second key problem is neighborhood explosion. A 2-layer GNN on a node with 100 average-degree neighbors requires 100 first-hop neighbors and up to 10,000 second-hop neighbors. A 3-layer GNN requires up to 1 million. GraphSAGE samples a fixed number of neighbors at each hop — 25 at hop 1, 10 at hop 2 — capping computation at 250 nodes per target node regardless of actual degree. This bounded fan-out is what makes mini-batch training tractable.

The aggregation function choice matters. Mean aggregation treats all neighbors equally. Max-pooling picks the most activated feature across neighbors — useful when a few neighbors carry strong signal and the rest are noise. LSTM aggregation has higher capacity but breaks permutation invariance, which is a theoretical violation for graph learning.

**NOT this.** "GraphSAGE requires full-batch training." GraphSAGE was specifically designed for mini-batch training by sampling a fixed number of neighbors at each hop. Full-batch GCN requires the entire adjacency matrix in memory — infeasible for graphs with billions of nodes. GraphSAGE's fixed fan-out sampling is the mechanism that enables mini-batch training: a batch of 512 target nodes with sample sizes [25, 10] requires loading at most 128,000 nodes from the feature store, regardless of graph size. The architecture is designed around this constraint.`,
    keyPoints: [
      `**GraphSAGE algorithm: for each node v, (1) sample a fixed-size neighborhood N(v) from the full neighbor set, (2) aggregate sampled neighbor features h_N(v) = AGGREGATE({h_u : u ∈ N(v)}), (3) concatenate ego + aggregated h_v = σ(W · CONCAT(h_v, h_N(v))).** Repeat for K layers. After K layers, each node's embedding encodes its K-hop neighborhood. The same W and aggregation function apply to every node at every layer — generalization is structural, not node-specific.`,
      `**Neighbor sampling controls the otherwise exponential neighborhood expansion.** Without sampling, a K-layer GNN on a node with 100 average-degree neighbors requires 100 1-hop, 10,000 2-hop, and 1M 3-hop neighbors. GraphSAGE samples a fixed |S_1| neighbors at hop 1, |S_2| at hop 2 — bounded computation per node. Sample sizes [25, 10] cap the computation at 250 nodes per target node for a 2-layer embedding, regardless of actual node degree.`,
      `**Mean aggregator: h_N(v) = σ(W · MEAN({h_u : u ∈ N(v) ∪ {v}})).** Equivalent to GCN's normalized aggregation without self-loops. Simple and effective, but treats all neighbors equally. Concatenating the ego embedding (CONCAT(ego, MEAN(neighbors))) rather than replacing it with the mean outperforms pure mean by preserving the central node's own identity — a node in a neighborhood of high-degree hubs has different properties than the hubs themselves.`,
      `**LSTM aggregator: applies an LSTM to a random permutation of neighbor features.** Empirically outperforms mean on some tasks despite being theoretically incorrect — LSTM is not permutation invariant, so different random orderings at inference give different embeddings. The LSTM may be exploiting a useful but spurious signal from node ID-based orderings. Use max-pooling if you want both good empirical performance and the theoretical correctness required by GNN theory.`,
      `**Max-pooling aggregator: h_N(v) = max({σ(W_pool · h_u + b) : u ∈ N(v)}).** Applies elementwise max after a learned transformation. Captures the most activated feature across neighbors — useful when some neighbors are highly informative and most are noise. Often the best performer for node classification on heterophilic graphs where the most anomalous neighbor, not the average neighbor, carries the signal.`,
      `**Inductivity is the architectural insight that separates GraphSAGE from prior methods.** Spectral GCN is trained with the full graph adjacency — its weights are tied to the specific graph via spectral filtering. GraphSAGE learns aggregation functions that map neighborhood features to embeddings — the same function applies to any neighborhood. New nodes: sample their neighbors, run the K-layer aggregation with trained weights, get an embedding in milliseconds. No retraining, no graph reconstruction.`,
      `**PinSage (Pinterest) is the reference production implementation: random-walk-based neighborhood sampling instead of uniform sampling (nodes visited more frequently in random walks from v are higher-weight neighbors); feature store (Redis/RocksDB) and graph store (adjacency lists) as separate systems; offline embedding computation via MapReduce; online serving via approximate nearest neighbor (FAISS/ScaNN).** The architecture — not the GNN itself — is what makes 2B-pin scale feasible.`,
      `**Mini-batch training computation: for a batch of target nodes, expand neighborhoods layer by layer.** For K=2 with sample sizes [10, 25]: a batch of 512 target nodes requires ~512\xd725 = 12,800 1-hop nodes and ~12,800\xd710 = 128,000 2-hop nodes. These nodes are fetched from a feature store, with neighborhood structure from a graph database. The feature lookup latency, not the GNN forward pass, dominates total training time at scale.`,
    ],
    checkQuestions: [
      {
        q: `A 3-layer GraphSAGE with neighbor sample sizes [15, 10, 5] is used to embed a batch of 256 target nodes. How many total nodes might be loaded from the feature store in the worst case?`,
        options: [
          `A) 256 \xd7 (15 + 10 + 5) = 7,680 nodes`,
          `B) Worst case (no overlap): 256 target + 256\xd75=1,280 depth-3 + 1,280\xd710=12,800 depth-2 + 12,800\xd715=192,000 depth-1 = 206,336 nodes; neighborhood overlap in dense graphs reduces this in practice, which is why sample sizes are kept small (5-25) and depth is limited to 2-3 layers`,
          `C) Exactly 256 \xd7 15 \xd7 10 \xd7 5 = 192,000 nodes, since all three sampling levels are always fully expanded`,
          `D) The worst case is 256 \xd7 max(15, 10, 5) = 3,840 because only the widest layer matters for memory`,
        ],
        answer: `B`,
      },
      {
        q: `Your GraphSAGE model is trained on a social network. A new user signs up with 3 connections to existing users. How do you compute their embedding without retraining?`,
        options: [
          `A) You cannot embed the new user without retraining — new nodes require full graph reconstruction`,
          `B) Run the forward pass inductively: fetch the 3 connected users' features (1-hop), sample their neighbors (2-hop), run K-layer aggregation with trained weights; no retraining required; if the user has 0 connections, fall back to ego-only embedding using content features`,
          `C) Use the average of all existing user embeddings as the new user's embedding until the next retraining cycle`,
          `D) Add the new user to the adjacency matrix and run a single forward pass of the full GCN on the updated graph`,
        ],
        answer: `B`,
      },
      {
        q: `Why is the LSTM aggregator in GraphSAGE theoretically flawed for graph learning, and under what conditions might it still be empirically useful?`,
        options: [
          `A) LSTM is theoretically flawed because it has too many parameters, causing overfitting on graph data`,
          `B) LSTM is not permutation invariant — neighbor ordering affects the output, violating the GNN requirement; empirically it may still work because random orderings during training act as augmentation, consistent node-ID orderings provide a spurious but useful signal, and higher LSTM capacity helps on some tasks — but use max-pooling for theoretical correctness`,
          `C) LSTM is flawed because it processes only sequential data and cannot handle the variable-length neighbor sets in graphs`,
          `D) LSTM aggregators are theoretically sound — the permutation invariance requirement only applies to graph-level tasks, not node-level aggregation`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `GraphSAGE's key innovation is learning an aggregation function rather than node embeddings — the same function applies to any neighborhood, so previously unseen nodes get embeddings by running the same procedure without any retraining. This inductivity is the non-negotiable requirement for production deployment where new nodes arrive continuously. Neighbor sampling (fixed fan-out per hop) solves the second key problem: the exponential neighborhood explosion that makes full-batch K-layer GNNs intractable on graphs with more than ~100K nodes.`,
  },
  {
    id: 'graph_attention',
    interactiveId: 'gnn_message_passing_viz',
    title: 'Graph Attention Networks',
    subtitle: 'Attention coefficients, multi-head GAT, GATv2 dynamic attention, edge features, when attention wins',
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['GAT', 'GATv2', 'attention', 'edge features', 'heterophily', 'multi-head'],
    interactivePrompt: `Before you touch the controls: a citation network weights all neighbors equally by degree normalization. A paper cited by Nature and a paper cited by a predatory journal both contribute the same weight to the aggregation. What would you want instead — and how would you learn which neighbors matter most?`,
    summary: `A citation network has 2708 papers. GCN weights all neighbor contributions equally by degree normalization — a paper cited by Nature and one cited by a predatory journal receive identical aggregation weights. The GCN has no mechanism to distinguish citation quality. For homophilic graphs where all neighbors are roughly equally informative, this is a reasonable prior. For graphs where neighbor relevance varies widely, it discards the most important signal.

Graph Attention Networks replace fixed aggregation weights with learned, data-dependent attention coefficients. For each edge (i, j), GAT computes an attention score from the features of both endpoints: α_{ij} = softmax(LeakyReLU(a^T [W h_i ‖ W h_j])). The aggregation becomes a weighted sum over neighbors, where each weight is proportional to how relevant that neighbor's features are. The Nature citation gets high attention weight; the predatory journal citation gets near zero.

The original GAT has a subtle flaw discovered by Brody et al. (2022): its attention is static. The computation e_{ij} = a^T · LeakyReLU(W₁h_i + W₂h_j) decomposes into independent source and target terms — the ranking of neighbor j is the same for every source node i. If neighbor A ranks above neighbor B for node i, it ranks above B for every other node in the graph. GATv2 fixes this by applying the nonlinearity after concatenating source and target features rather than before: e_{ij} = a^T · LeakyReLU(W · [h_i ‖ h_j]). Now the joint (i, j) representation enters the nonlinearity, making attention genuinely dynamic — different source nodes produce different neighbor rankings.

**NOT this.** "GAT always outperforms GCN." GAT adds attention parameters and significantly more compute. For homogeneous graphs where all neighbors are equally relevant — regular lattices, uniformly connected networks — the attention overhead produces near-uniform weights and doesn't pay off. Inspect the learned α_{ij} distribution before claiming attention is doing useful work: concentrated attention indicates genuine differential relevance; near-uniform attention indicates mean aggregation would work equally well at lower cost. Use GCN for uniform-weight problems, GAT when neighbor importance genuinely varies.`,
    keyPoints: [
      `**GAT attention coefficient: e_{ij} = LeakyReLU(a^T · CONCAT(W\xb7h_i, W\xb7h_j)) where a is a learnable attention vector and W is a shared linear transformation.** Softmax over all neighbors: α_{ij} = softmax_j(e_{ij}) = exp(e_{ij}) / Σ_{k∈N(i)} exp(e_{ik}). Aggregation: h'_i = σ(Σ_j α_{ij} W h_j). The attention weights are learned end-to-end — no explicit supervision on which neighbors matter.`,
      `**Static attention problem in original GAT (Brody et al., 2022): GAT computes e_{ij} = a^T · LeakyReLU(W₁h_i + W₂h_j).** This can be rewritten as a^T · LeakyReLU(f(i) + g(j)) — the ranking of neighbors j is the same for every source node i because the attention decomposes into independent source and target terms. If neighbor A ranks above neighbor B for node i, it ranks above B for every other node in the graph. This is not dynamic attention — it is a global neighbor relevance score, independent of the querying node.`,
      `**GATv2 fix: e_{ij} = a^T · LeakyReLU(W · CONCAT(h_i, h_j)).** The nonlinearity is applied after concatenating source and target features — the interaction between h_i and h_j happens before the nonlinearity, so the attention is a function of the joint (i, j) representation rather than a sum of independent terms. Different source nodes now produce different neighbor rankings. This is dynamic attention and it is strictly more expressive than the original GAT.`,
      `**Multi-head attention: run K independent heads with separate (W^k, a^k) parameters.** For hidden layers: concatenate K heads h'_i = ‖_{k=1}^K σ(Σ_j α^k_{ij} W^k h_j). For the final layer: average the K heads. K=8 heads is typical. Each head learns to attend to a different relational aspect of the graph structure — one head may learn structural proximity, another may learn feature similarity, another may focus on high-degree hubs.`,
      `**Edge features extend GAT to incorporate relationship-specific information: e_{ij} = a^T · σ(W₁h_i + W₂h_j + W_e · e_{ij}^{feat}) where e_{ij}^{feat} is the edge feature vector (relationship type, edge weight, transaction amount, time delta).** Critical in knowledge graphs where the edge type determines the entire semantic relationship between entities. RGAT (Relational GAT) uses relation-specific attention parameters, one per edge type.`,
      `**When attention outperforms mean aggregation: heterophilic graphs (attention can downweight neighbors with different labels); graphs with noisy edges (spurious connections, bots in social networks — attention can learn to ignore them); graphs with highly variable degree (soft normalization via attention adapts better than hard degree normalization); tasks where local structure varies significantly across the graph.**`,
      `**Attention weights are interpretable in principle but often surprisingly uniform in practice.** In homophilic graphs where all neighbors are equally informative, the model learns near-uniform attention rather than focusing. Don't assume GAT attention is always semantically meaningful — inspect α_{ij} distributions before claiming interpretability. Concentrated attention indicates genuine differential relevance; near-uniform attention indicates mean aggregation would work equally well.`,
      `**Attention collapse in deep GAT networks: weights concentrate on the same hub nodes across all layers, creating an information bottleneck and accelerating over-smoothing.** Fix: dropout on attention coefficients α_{ij} during training — regularizes attention, prevents concentration on a small set of hubs, and is included in the original GAT paper for this reason.`,
    ],
    checkQuestions: [
      {
        q: `What is the static attention problem in the original GAT, and how does GATv2 solve it?`,
        options: [
          `A) Static attention means GAT uses the same attention weights across all layers; GATv2 uses separate weights per layer`,
          `B) Original GAT computes e_{ij} = a^T · LeakyReLU(W₁h_i + W₂h_j), which decomposes into f(i) + g(j) — the neighbor ranking is the same for all source nodes; GATv2 computes e_{ij} = a^T · LeakyReLU(W · CONCAT(h_i, h_j)), placing the nonlinearity after concatenation so source-target interaction happens before the nonlinearity, enabling dynamic per-source neighbor rankings`,
          `C) Static attention means the attention weights are computed once at initialization and not updated during training; GATv2 uses gradient-based attention updates`,
          `D) The static attention problem is that original GAT ignores edge features; GATv2 adds an edge feature term to the attention computation`,
        ],
        answer: `B`,
      },
      {
        q: `You are building a fraud detection GNN. The graph has legitimate users with many connections (hubs) and fraudsters with few connections. Why might mean aggregation fail, and how would GAT help?`,
        options: [
          `A) Mean aggregation fails because fraudsters have fewer connections, making their embeddings less accurate; GAT helps by up-weighting low-degree nodes`,
          `B) Mean aggregation dilutes the fraud signal by averaging over hundreds of legitimate neighbors; GAT can learn to assign high attention to the few suspicious neighbors (unusual transaction amounts, rare merchant categories) and downweight the majority of normal neighbors; add edge features (amount, time, merchant type) to make attention transaction-aware`,
          `C) Mean aggregation fails for fraud detection only when the graph is heterophilic; if fraudsters connect primarily to other fraudsters, mean aggregation would work fine`,
          `D) GAT helps fraud detection primarily because multi-head attention allows the model to learn 8 independent fraud patterns simultaneously`,
        ],
        answer: `B`,
      },
      {
        q: `Explain why the softmax normalization in GAT can be problematic in graphs with very high-degree nodes, and what you would do about it.`,
        options: [
          `A) High-degree nodes dominate training because they contribute more gradient updates; fix by down-sampling their neighborhoods`,
          `B) For a hub with 10,000 neighbors, softmax normalizes over all of them — the highest-relevance neighbor's weight is diluted by the large denominator, making aggregation behave like a uniform average; alternatives include top-K attention, sigmoid attention (no normalization), sampling neighbors before applying attention, or degree normalization`,
          `C) Softmax is fine for high-degree nodes — attention weights naturally concentrate on the most relevant neighbors regardless of degree`,
          `D) High-degree nodes cause numerical overflow in the softmax denominator; fix by L2-normalizing attention logits before softmax`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `GATv2 fixes a subtle but consequential flaw in the original GAT: original GAT attention is static — the ranking of neighbors is the same for every source node because the nonlinearity is applied to linearly separable source and target terms. GATv2 applies the nonlinearity after concatenating source and target features, making attention dynamic — different source nodes produce different neighbor rankings. This matters whenever the relevance of a neighbor depends on the identity of the querying node, which is the common case in heterophilic graphs, heterogeneous graphs, and any setting where relationships are asymmetric.`,
  },
  {
    id: 'message_passing_framework',
    interactiveId: 'gnn_message_passing_viz',
    title: 'Message Passing Neural Networks (MPNN)',
    subtitle: 'Unified MPNN view, 1-WL test, expressiveness limits, higher-order GNNs, graph Transformers',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['MPNN', 'Weisfeiler-Leman', 'expressiveness', 'higher-order', 'graph Transformer', 'isomorphism'],
    interactivePrompt: `Before you touch the controls: a caffeine molecule has 24 atoms as nodes and 25 bonds as edges. After 3 rounds of message passing, each atom's representation should encode its local chemical environment. What information does an atom have after round 1? After round 3? And what molecular property prediction task might require more than 3 rounds?`,
    summary: `A caffeine molecule has 24 atoms (nodes) and 25 bonds (edges). Task: predict whether it is toxic. Each atom has features — element type, charge, hybridization. Each bond has features — single, double, or aromatic. A standard MLP on a feature vector per atom would ignore the molecular structure entirely. You need a model that propagates information through the chemical graph.

Message passing is the mechanism. In each round, every atom sends its representation to its bonded neighbors. Every atom aggregates messages from its neighbors and updates its representation. After K rounds, each atom's representation encodes its K-hop chemical environment — the atoms within K bonds of it. A readout function aggregates all atom representations to a molecular property prediction. After 3 rounds, the nitrogen in caffeine's ring "knows" what the carbons 3 bonds away look like. This structural awareness is what makes the model useful.

GCN, GAT, and GraphSAGE look different architecturally, but they are all instances of the same three-step pattern: compute messages, aggregate at nodes, update node states. This unification — the MPNN framework (Gilmer et al., 2017) — also reveals a hard ceiling: no MPNN can be more powerful than the 1-dimensional Weisfeiler-Leman graph isomorphism test. Mean-aggregation GNNs like GCN are strictly below even that ceiling. GIN with sum aggregation reaches the 1-WL ceiling. For most node classification tasks on social networks, this ceiling rarely matters. For molecular chemistry where ring structure determines chemical properties, it matters a great deal.

**NOT this.** "Message passing requires a fixed number of rounds K." In practice K = 3–6 works for most molecular property prediction tasks, matching the chemical neighborhood relevant to properties. More rounds cause over-smoothing: all nodes converge to similar representations as information propagates through the entire graph, and individual atom identities are lost. The right K depends on the task's relevant locality — drug toxicity depends mostly on functional groups within 3–4 bonds, not the entire molecule. Long-range interactions in protein folding require a different architecture (graph Transformers) rather than more message-passing rounds.`,
    keyPoints: [
      `**MPNN framework (Gilmer et al., 2017): three phases per layer. (1) Message: m_{vw}^t = M_t(h_v^t, h_w^t, e_{vw}) — compute a message for each directed edge using source features, target features, and edge features. (2) Aggregate: a_v^t = Σ_{w∈N(v)} m_{vw}^t — collect all incoming messages with a permutation-invariant function. (3) Update: h_v^{t+1} = U_t(h_v^t, a_v^t) — update node state from previous state and aggregated messages.** GCN, GAT, and GraphSAGE are all instances of this framework with different M, aggregate, and U choices.`,
      `**1-Weisfeiler-Leman (1-WL) test: algorithm for deciding if two graphs are isomorphic.** Each node starts with a color (hash of its label). At each step: new color = hash(current color, sorted multiset of neighbor colors). Repeat until stable. Two graphs are distinguished if they produce different final color histograms. 1-WL is the formal upper bound on what any MPNN can express — an MPNN that is 1-WL equivalent can distinguish any pair of graphs that 1-WL can distinguish, and fails on any pair 1-WL cannot.`,
      `**GIN (Graph Isomorphism Network, Xu et al. 2019): the maximally expressive MPNN.** Key theorem: a GNN reaches the 1-WL upper bound if and only if its aggregation function is injective over multisets. GIN achieves this with: h_v^{l+1} = MLP((1+ε)h_v^l + Σ_{u∈N(v)} h_u^l). The (1+ε) term ensures the self-embedding and neighbor sum combine injectively. Sum aggregation is injective (different multisets map to different sums); mean is not ({1,2,3} and {1,1,4} have the same mean of 2).`,
      `**1-WL failure cases matter for chemistry: regular graphs — all k-regular graphs with the same node count look identical to 1-WL because every node has the same degree and identical 1-hop neighborhood structure.** Cycles: 1-WL cannot distinguish a 3-cycle + 3-cycle (two disconnected triangles) from a 6-cycle. In chemistry, these correspond to molecules with the same atom types and degree sequence but different ring structures — directly limiting GNN accuracy for property prediction of cyclic compounds.`,
      `**Higher-order WL and GNNs: k-WL tests work on k-tuples of nodes rather than individual nodes, achieving exponentially greater expressiveness. k-GNN computes messages between k-tuples.** DS-GNN and PPGN approximate higher-order expressiveness with better scalability. For most real-world node classification and link prediction tasks, 1-WL expressiveness is sufficient — the graphs that fool 1-WL rarely appear in social or transactional graphs.`,
      `**Structural features can be precomputed and added as node features to augment GNN expressiveness beyond 1-WL: degree, triangle count, clustering coefficient, eigenvector centrality, betweenness centrality.** These encode structural information that message passing cannot extract from features alone. Random positional encodings can also break the symmetry that causes 1-WL failures — giving each node a unique identity breaks regular graph symmetry at the cost of losing permutation equivariance.`,
      `**Graph Transformers apply self-attention to all pairs of nodes rather than only connected pairs.** Every node attends to every other node — O(|V|\xb2) complexity. This exceeds 1-WL expressiveness because attention sees all pairwise relationships simultaneously. Graphormer achieves SOTA on molecular benchmarks. GPS combines local MPNN with global Transformer attention at tractable cost. For small molecular graphs (≤100 atoms), O(|V|\xb2) is feasible; for social networks with millions of nodes, it is not.`,
      `**Over-squashing: information from distant nodes must be compressed through narrow topological bottlenecks.** In a tree-like graph, the single bridge node between two subtrees must carry all cross-subtree information — gradients vanish through the bridge, making the model insensitive to distant but relevant nodes. Symptom: removing distant node features doesn't change predictions. Fixes: graph rewiring (add shortcuts), virtual nodes (one global node connected to all others), or graph Transformers that bypass topological constraints entirely.`,
    ],
    checkQuestions: [
      {
        q: `Show that a mean-aggregation GNN (GCN) is strictly less expressive than 1-WL. Give a concrete example of two different neighborhood structures that GCN cannot distinguish.`,
        options: [
          `A) GCN is as expressive as 1-WL; it can distinguish all neighborhood structures that 1-WL can distinguish`,
          `B) Mean aggregation is not injective over multisets — a node with neighbors {1,2,3} (mean=2) and a node with neighbors {1,1,4} (mean=2) produce the same aggregated value; GCN cannot distinguish them; 1-WL hashes the full multiset, which distinguishes {1,2,3} from {1,1,4}; sum-based GIN is strictly more expressive`,
          `C) GCN is strictly more expressive than 1-WL because it uses continuous features rather than discrete colors`,
          `D) GCN cannot distinguish neighborhood structures only when node features are identical; with diverse features, mean aggregation is equivalent to 1-WL`,
        ],
        answer: `B`,
      },
      {
        q: `What is over-squashing in GNNs, and how would you diagnose and fix it in a production model?`,
        options: [
          `A) Over-squashing is when too many features are compressed into a small embedding dimension; fix by increasing the hidden size`,
          `B) Over-squashing: information from distant nodes is compressed through narrow topological bottlenecks (bridges, articulation points), causing the Jacobian ∂h_v/∂x_u to decay exponentially for distant pairs; diagnose by computing sensitivity for relevant node pairs; fix with graph rewiring (add shortcuts), virtual nodes, or Graph Transformers that bypass topological constraints`,
          `C) Over-squashing is identical to over-smoothing — both are caused by stacking too many GNN layers`,
          `D) Over-squashing only affects graph-level tasks; for node classification, topological bottlenecks have no effect on prediction quality`,
        ],
        answer: `B`,
      },
      {
        q: `GIN achieves maximal 1-WL expressiveness. Why does it still fail to distinguish some pairs of non-isomorphic graphs, and what class of graphs is this?`,
        options: [
          `A) GIN fails because it uses sum aggregation, which is less stable than mean for graphs with high-degree nodes`,
          `B) GIN is 1-WL equivalent — it fails on exactly the pairs that 1-WL fails on: k-regular graphs of the same size (all nodes have identical 1-hop structure), and certain chemical graph pairs like Decalin vs bicyclo[2.2.2]octane; fixes require higher-order GNNs, structural features (triangle count), or random positional encodings`,
          `C) GIN fails on any graph where the node features are not one-hot encoded — continuous features are outside the 1-WL framework`,
          `D) GIN fails on large graphs with more than 10,000 nodes because the sum aggregation overflows numerically`,
        ],
        answer: `B`,
      },
      {
        q: `Explain why graph Transformers are more expressive than MPNNs and what practical tradeoff this introduces at scale.`,
        options: [
          `A) Graph Transformers are more expressive because they use multi-head attention, which MPNNs lack`,
          `B) Graph Transformers apply attention between all pairs of nodes regardless of edges, eliminating over-squashing and exceeding 1-WL expressiveness; the tradeoff is O(|V|\xb2) attention complexity — infeasible for graphs with millions of nodes; practical solutions include top-K sparse attention, GPS (local MPNN + global sampled attention), or restricting to small molecular graphs (≤100 atoms)`,
          `C) Graph Transformers are more expressive because they process all nodes in parallel rather than message-passing sequentially`,
          `D) The expressiveness gain of Graph Transformers is purely theoretical — in practice they perform similarly to GIN on all benchmarks`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Every MPNN is bounded by the 1-Weisfeiler-Leman test, and mean-aggregation GNNs (GCN, GraphSAGE) are strictly below that ceiling — mean cannot distinguish multisets with the same average, so nodes with neighborhoods {1,2,3} and {1,1,4} are indistinguishable. GIN with sum aggregation reaches the 1-WL ceiling. This expressiveness limit is consequential for molecular chemistry and combinatorial tasks where substructure counts matter, but for node classification and link prediction on real-world graphs, the empirical performance gap between GCN and GIN usually closes. The key is knowing which regime you're operating in.`,
  },
  {
    id: 'link_prediction',
    interactiveId: 'gnn_message_passing_viz',
    title: 'Link Prediction',
    subtitle: 'Heuristics, embedding decoders, knowledge graph completion, negative sampling, evaluation pitfalls',
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['link prediction', 'knowledge graph', 'TransE', 'negative sampling', 'MRR', 'Hits@K', 'data leakage'],
    interactivePrompt: `Before you touch the controls: Freebase has 40 million entities and 100 million triples like (Christopher Nolan, directed, Inception) and (Inception, hasGenre, SciFi). Most triples are missing — the graph is incomplete. If a user likes Inception, how would you use the knowledge graph structure to predict other films they might like?`,
    summary: `Freebase contains 40 million entities — actors, movies, directors — and 100 million triples: (Christopher Nolan, directed, Inception), (Inception, hasGenre, SciFi), (Leonardo DiCaprio, actedIn, Inception). Most triples are missing. The graph is an incomplete snapshot of a much larger set of true facts. Link prediction asks: what missing triples are likely true? If a user likes Inception, knowledge graph link prediction can infer other Nolan films the user might like by finding films connected to Nolan through the "directed" relation.

Two traps define the field. First, structural heuristics often match or beat learned GNN models on homophilic networks, because triangle closure is the dominant link formation mechanism. Common Neighbors, Adamic-Adar, and Katz scores run in O(|E|) time with no training and are surprisingly competitive on social and citation graphs. Always establish a heuristic baseline before training a GNN. If the GNN doesn't beat Adamic-Adar, the model is learning nothing the structure doesn't already tell you.

Second, evaluation is easy to get wrong in ways that inflate reported accuracy without any genuine generalization. If test edge (A, B) has training edges (A, C) and (C, B) in the training graph, the GNN encodes C's embedding in both A's and B's representations. The dot product between A's and B's embeddings is high because both reflect the shared neighbor C — not because the model generalized. The correct procedure removes test edges from the training adjacency matrix before any GNN training.

**NOT this.** "Knowledge graphs require hand-crafted ontologies." Modern knowledge graphs are mostly extracted from text automatically using information extraction and OpenIE systems. Wikidata has 90 million-plus triples and is collaboratively maintained. The knowledge graph embedding literature — TransE, RotatE, ComplEx — focuses on how to learn representations from the triple structure, not how to curate the ontology. The curation question is upstream of the ML question, and for most research and production applications it is already solved.`,
    keyPoints: [
      `**Structural heuristics run in O(|E|) time, require no training, and often outperform learned models on homophilic citation and social networks.** Common Neighbors (CN): score(u,v) = |N(u) ∩ N(v)|. Adamic-Adar: Σ_{w∈N(u)∩N(v)} 1/log(|N(w)|) — downweights high-degree common neighbors that provide less specific signal. Katz index: Σ_{l=1}^∞ β^l |paths_{uv}^l| — counts all paths between u and v with exponential decay. Always establish a heuristic baseline before training a GNN; if the GNN doesn't beat Adamic-Adar, the model is not learning anything the structure doesn't already tell you.`,
      `**Dot product decoder: P(edge) = σ(z_u · z_v).** Works when proximity in embedding space correlates with link existence. Simple, fast, and used in most GraphSAGE-based systems. The limitation: dot product only captures symmetric, linear similarity — it cannot model asymmetric relationships (A follows B without B following A) or nonlinear compatibility.`,
      `**Bilinear decoder: P(edge) = σ(z_u^T R z_v) where R ∈ ℝ^{d×d} is a learned relation matrix.** More expressive — R captures asymmetric relationships (non-symmetric R means P(u→v) ≠ P(v→u)). For heterogeneous graphs with multiple relation types, use relation-specific R_r matrices (DistMult, RESCAL models). The cost: R adds d\xb2 parameters and can overfit on small graphs.`,
      `**Knowledge graph completion: KGs store (head, relation, tail) triples — but most triples are missing.** TransE: h + r ≈ t, score = -‖h + r - t‖. Captures simple relational patterns but fails for symmetric relations (requires r=0, collapsing all entities). RotatE: models relations as rotations in complex space, handling symmetric, antisymmetric, inverse, and composition patterns. ComplEx: complex-valued embeddings handle asymmetric relations.`,
      `**Negative sampling strategy matters more than most practitioners realize.** Random (u,v) pairs from the full node set are trivially easy negatives — nodes from entirely different domains don't connect. Better: corrupt head or tail of a positive triple randomly (KG completion standard). Hard negatives — sample near-positives in embedding space — provide the richest gradient but risk false negatives. k=5–20 negatives per positive is typical; too many easy negatives and the model learns nothing; too many hard negatives and training destabilizes.`,
      `**Evaluation metrics: AUC-ROC for binary link prediction, measuring overall discriminative performance.** MRR (Mean Reciprocal Rank) and Hits@K (fraction of correct entities ranked in top K) for KG completion, where the task is ranking candidates. Filtered evaluation: when computing rank, remove all other known positive triples from the ranking list — otherwise the model is penalized for correctly ranking true triples above the target triple.`,
      `**Data leakage in link prediction: if edge (u,v) is the test edge but edges (u,w) and (w,v) are in training, then the GNN learns w's embedding and incorporates it into both u's and v's representations.** The dot product z_u · z_v is high because both reflect the shared neighbor w. The model appears to predict (u,v) correctly, but only because it saw the triangle during training — not because it generalized to an unseen edge. Correct procedure: remove all test and validation edges from the training adjacency matrix before training.`,
      `**SEAL (Zhang & Chen, 2018): extracts the local enclosing subgraph around each candidate link (K-hop neighborhood of the pair), assigns structural labels (shortest-path distance to each endpoint), and trains a graph-level GNN classifier.** By training on subgraph structure rather than global node embedding proximity, SEAL avoids the leakage problem and captures the structural pattern around the link directly. Achieves best results on citation and social network benchmarks partly for this reason.`,
    ],
    checkQuestions: [
      {
        q: `You're building a friend recommendation system. Should you use Adamic-Adar or a GNN-based approach? What factors decide this?`,
        options: [
          `A) Always use a GNN — heuristics are only suitable for academic benchmarks, not production systems`,
          `B) Use Adamic-Adar when the network is highly homophilic, you have no node features, and low latency/interpretability are priorities — it achieves 80-90% of GNN AUC on social networks at O(|E|) cost; use GNN when rich node features, heterogeneous graph structure, inductive requirements, or the remaining 10-20% lift justify the engineering cost`,
          `C) Use Adamic-Adar for cold-start users and GNN for all other users — the split is always by user activity level`,
          `D) GNNs always outperform Adamic-Adar on social networks; heuristics are only competitive on citation networks`,
        ],
        answer: `B`,
      },
      {
        q: `Explain why TransE fails for symmetric relations in knowledge graphs and what model you would use instead.`,
        options: [
          `A) TransE fails for symmetric relations because it uses L2 distance instead of cosine similarity`,
          `B) TransE requires h + r = t; for symmetric r(a,b) and r(b,a): adding both equations forces r=0, collapsing all entities to the same point; RotatE models r as complex rotation — symmetric relations satisfy r\xb2 = 1 (r_i = ±1) without forcing r=0, handling symmetric, inverse, and composition patterns`,
          `C) TransE fails for symmetric relations only when the embedding dimension is too small; increasing d resolves the issue`,
          `D) TransE can model symmetric relations with a symmetric initialization; the failure only occurs with random initialization`,
        ],
        answer: `B`,
      },
      {
        q: `Describe exactly how data leakage happens in link prediction and design a correct train/validation/test split for a citation network.`,
        options: [
          `A) Data leakage in link prediction occurs when node features are not normalized consistently across splits`,
          `B) Leakage: if test edge (A,B) has training edges (A,C) and (C,B), the GNN encodes C in both A's and B's embeddings, making z_A·z_B high from learned structural proximity — not genuine generalization; correct split: remove all test/validation edges from the training adjacency before training; for temporal graphs, always split by time to prevent future knowledge leakage`,
          `C) Data leakage in link prediction is only an issue for knowledge graphs; for citation networks, random edge splits are always valid`,
          `D) The correct split is to remove test nodes (not edges) from training — edges between training nodes are safe to include regardless of their test status`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Evaluation methodology is the most dangerous part of link prediction. Naive random edge splits allow the GNN to learn paths through test edges during training, inflating apparent accuracy without any genuine generalization. The correct procedure removes test edges from the training adjacency matrix entirely — the GNN must never see paths through edges it will be tested on. For temporal graphs, a time-based split is mandatory: a model trained with future knowledge and evaluated on past links is measuring recall of a known graph, not prediction of an unknown one.`,
  },
  {
    id: 'node_classification_at_scale',
    title: 'Scalable GNNs for Node Classification',
    subtitle: 'Neighbor explosion, Cluster-GCN, GraphSAINT, SIGN, cold-start, class imbalance',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['scalable GNN', 'Cluster-GCN', 'GraphSAINT', 'SIGN', 'cold-start', 'mini-batch', 'imbalance'],
    interactivePrompt: `Before you touch the controls: a 2-layer GNN on a node with average degree 100 needs 100 first-hop neighbors and up to 10,000 second-hop neighbors. A 3-layer GNN needs up to 1 million. For a graph with 100 million nodes, full-batch training is impossible. What are your options for training in mini-batches — and what does each approach trade away?`,
    summary: `A 2-layer GNN on a node with average degree 100 requires 100 first-hop and up to 10,000 second-hop neighbors. A 3-layer GNN requires up to 1 million. For a graph with 100 million nodes, full-batch training is not a slow option — it is not an option at all. This is the neighbor explosion problem, and it appears immediately when scaling beyond academic benchmarks.

Three production approaches exist. Cluster-GCN partitions the graph into dense clusters using METIS. Each mini-batch is one cluster; GNN training runs entirely within the cluster. No neighbor explosion because the subgraph is bounded. The approximation error is the ignored cross-cluster edges. For graphs with strong community structure, these are few. For globally connected graphs, ignoring cross-cluster edges causes significant distribution shift.

GraphSAINT samples random node-induced or edge-induced subgraphs for each mini-batch and normalizes message aggregations by sampling probability to produce unbiased gradient estimates. The normalization coefficients are precomputed offline. This works better for globally connected graphs where METIS would cut through many informative edges.

SIGN precomputes multi-hop diffusion features offline — X^k = (D̃^{-1/2} Ã D̃^{-1/2})^k X for each k — and stores them on disk. At training time: load precomputed features for a mini-batch, concatenate, pass through an MLP. No graph structure needed during training. As fast as a tabular model. The limitation: all neighborhood information is fixed at precompute time and cannot adapt to new edges.

**NOT this.** "Cluster-GCN is always the right choice for large graphs." Cluster-GCN works well when the graph has strong community structure so cross-cluster edges are few. On a globally connected graph like Reddit (230K nodes, 11M edges, low community structure), METIS would cut through many informative inter-community edges, and the model trained on disconnected clusters would perform poorly on full-graph inference. GraphSAINT with random walk sampling achieves 93% accuracy on Reddit versus Cluster-GCN's 90.4%. The choice depends on graph structure: dense communities favor Cluster-GCN, globally connected graphs favor GraphSAINT.`,
    keyPoints: [
      `**Neighbor explosion: a K-layer GNN computing embeddings for a batch of B nodes requires up to B \xd7 (avg_degree)^K nodes in the K-hop neighborhood.** For K=3, avg_degree=100, B=512: up to 512 \xd7 10^6 = 512M node feature lookups per step. Memory and I/O make this impossible at graph scale. Sampling bounds the fan-out to a fixed number per hop, introducing approximation error in exchange for tractability.`,
      `**Cluster-GCN (Chiang et al., 2019): partition the graph into dense clusters using METIS.** Each mini-batch consists of one or several clusters — GNN training runs entirely within the cluster, with no cross-cluster message passing. No neighbor explosion because the subgraph is bounded. The approximation error is the ignored cross-cluster edges — for graphs with strong community structure, these are few; for globally connected graphs, ignoring them introduces significant distribution shift.`,
      `**GraphSAINT (Zeng et al., 2020): sample random node-induced or edge-induced subgraphs for each mini-batch.** Train the full GNN on the subgraph. Key insight: normalize message aggregations by their sampling probability to produce unbiased gradient estimates — the normalization coefficients are precomputed offline. Three samplers: node sampler, edge sampler, random walk sampler. Random walk sampling produces more diverse, representative subgraphs than node or edge sampling alone.`,
      `**SIGN (Scalable Inception GNNs, Frasca et al., 2020): precompute multi-hop diffusion features offline for each hop k ∈ {0,1,...,K} as X^k = (D̃^{-1/2} Ã D̃^{-1/2})^k X and store on disk.** At training time: load X^0,...,X^K for a mini-batch, concatenate, pass through an MLP. No graph structure needed during training — as fast as a tabular model. Limitation: all neighborhood information is fixed at precompute time; cannot adapt to dynamic graphs or new edges.`,
      `**Graph distribution shift: the training subgraph has different structural statistics than the full graph — degree distributions, local clustering coefficients, inter-community edge density.** A model trained on dense clusters (Cluster-GCN) receives embeddings that reflect within-cluster topology; full-graph inference includes cross-cluster edges that shift the input distribution the classifier head receives. The 5% accuracy gap between Cluster-GCN training accuracy and full-graph inference accuracy is the canonical symptom of this.`,
      `**Cold-start for new nodes: a new node with no edges has no neighborhood for message passing.** GraphSAGE falls back to the ego-only embedding (content features only, no aggregation). Production solutions: MLP baseline for new nodes; content-based nearest-neighbor lookup to find similar existing nodes and average their embeddings; GraphSAGE with a few initial edges using 1-hop aggregation; delayed graph incorporation where new nodes are added to the training graph in the next batch cycle.`,
      `**Class imbalance is often a larger performance driver than architecture choice.** Fraud (0.1% positive rate), spam (1%). For GNNs: class-weighted focal loss (weight the minority class by up to 1000\xd7), BalancedSampler (guarantee equal positive/negative representation per batch). Structural imbalance amplifies label imbalance: fraudsters often have fewer connections, producing sparser neighborhoods with weaker aggregation signal. Adding degree and clustering coefficient as explicit node features compensates for the information lost from shallow neighborhoods.`,
      `**Scalability tradeoffs in practice: Cluster-GCN for graphs with dense communities (e-commerce product graphs, academic citation networks).** GraphSAINT for globally connected graphs with poor community structure (Reddit, general social networks). SIGN for static graphs where features change slowly — fastest training and inference. GraphSAGE mini-batch for dynamic graphs where the graph changes continuously and precomputed aggregations become stale. Full-batch GCN only for graphs under ~500K nodes on 80GB GPU.`,
    ],
    checkQuestions: [
      {
        q: `Your GNN is trained with Cluster-GCN but accuracy on the full graph is 5% lower than on the training clusters. Diagnose the problem and propose fixes.`,
        options: [
          `A) The 5% gap is expected — always evaluate on training clusters; full-graph evaluation is not meaningful for cluster-based training`,
          `B) Graph distribution shift: Cluster-GCN ignores cross-cluster edges during training, so the model learns from within-cluster topology only; full-graph inference includes those edges, shifting the input distribution; fix with multi-cluster mini-batching (include inter-cluster edges), switch to GraphSAINT's edge sampler, or always evaluate with full-graph inference even during training`,
          `C) The gap indicates overfitting to training clusters; reduce model depth from 2 layers to 1`,
          `D) The gap is caused by METIS producing unbalanced partitions; switch to random partitioning for uniform cluster sizes`,
        ],
        answer: `B`,
      },
      {
        q: `Design the architecture for GNN-based fraud detection at a payments company with 100M users, 1B transactions per day, and 0.1% fraud rate. Focus on scalability and handling cold-start.`,
        options: [
          `A) Use full-batch GCN on the daily transaction graph; 100M nodes fits on a modern GPU cluster; apply SMOTE for class imbalance`,
          `B) Bipartite user-merchant graph with transaction edge features; SIGN for daily batch embeddings, GraphSAGE mini-batch for near-real-time high-risk transactions; focal loss with 1000\xd7 fraud weight; MLP-only for cold-start new users until 5+ transactions; GAT for interpretability (log top attention neighbors for analyst review); time-based evaluation split`,
          `C) Train separate GNNs for each merchant category to avoid class imbalance; ensemble their outputs at serving time`,
          `D) Use a simple MLP on aggregated user features rather than a GNN — transaction graphs are too dynamic for GNN-based fraud detection`,
        ],
        answer: `B`,
      },
      {
        q: `Compare GraphSAINT and Cluster-GCN on a large Reddit graph (230K nodes, 11M edges, highly connected). Which would you choose and why?`,
        options: [
          `A) Cluster-GCN is better because its METIS partitioning is deterministic and therefore more reproducible than GraphSAINT's random sampling`,
          `B) GraphSAINT with random walk sampling is better for Reddit — the graph lacks strong community structure so METIS would cut through many informative cross-community edges, causing high distribution shift; random walk sampling traverses the graph topology-agnostically and produces representative subgraphs; GraphSAINT achieves 93.0% vs Cluster-GCN's 90.4% on this benchmark`,
          `C) Both methods perform identically on highly connected graphs — the choice should be based on implementation complexity, not accuracy`,
          `D) SIGN is the best choice for Reddit because it precomputes all aggregations offline, eliminating the graph sampling problem entirely`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The neighbor explosion problem — a K-layer GNN's required neighborhood grows exponentially with K — makes full-batch training impossible at scale and forces a choice between partitioning (Cluster-GCN), subgraph sampling (GraphSAINT), and offline precomputation (SIGN). The choice depends on graph structure and whether embeddings need to be dynamic. The often-overlooked issue is training-time distribution shift: a GNN trained on dense clusters performs 5% worse on the full graph because the cross-cluster edges it never saw during training shift the input distribution at inference time. Always evaluate with full-graph inference even when training uses mini-batches.`,
  },
  {
    id: 'heterogeneous_graphs',
    title: 'Heterogeneous Graph Neural Networks',
    subtitle: 'Node/edge types, HAN, HGT, meta-paths, knowledge graphs, when to model heterogeneity',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['heterogeneous graph', 'HAN', 'HGT', 'meta-path', 'knowledge graph', 'RGCN', 'relational'],
    interactivePrompt: `Before you touch the controls: an e-commerce graph has User, Item, Category, and Brand nodes connected by views, purchases, belongs_to, and makes edges. A homogeneous GNN treating all nodes and edges the same discards the distinction between a "view" edge and a "purchase" edge. What would that cost you commercially — and what would you need the model to do instead?`,
    summary: `Pinterest has Pin, Board, User, and Image nodes connected by Save, Click, Follow, and Similarity edges. A homogeneous GNN that ignores node and edge types aggregates all neighbor types together — a "Click" edge and a "Purchase" edge contribute identically to the target node's embedding. But a user purchasing an item is a fundamentally different signal than a user clicking it. Treating them the same discards the relational semantics that distinguish high-intent from low-intent interactions — often the most commercially valuable signals in the graph.

Heterogeneous GNNs model type information explicitly. RGCN uses relation-specific weight matrices: one W_r per relation type. With 25 relation types and embedding dimension 256, that is 25 × 256² = 1.6 million parameters just for relation weights — and rare relation types with under 1,000 training edges have insufficient gradient to learn their full matrix. This is the overparameterization problem.

HGT (Heterogeneous Graph Transformer) solves this with shared weights and small relation-specific modifiers. Type-specific key/query/value projections handle the (src_type, edge_type, dst_type) triplet with parameter growth O(|A| × d²) plus O(|R| × d) for relation modifiers — substantially better than RGCN's O(|R| × d²). HGT learns which relation triplets are informative end-to-end without manual meta-path specification.

**NOT this.** "You can encode type information as a feature instead of modeling it architecturally." Adding a one-hot type embedding to node or edge features and using a homogeneous GNN is a reasonable baseline. It works when relation types are numerous and sparse (100+ types with few examples each) and when you need a fast baseline. It fails when edge types carry fundamentally different semantic meaning — a purchase deserves different aggregation weights than a click, not just a different input feature to the same aggregation function. Architectural heterogeneity is not advanced; ignoring it is a lossy choice that should be made deliberately, not by default.`,
    keyPoints: [
      `**Heterogeneous graph definition: G = (V, E, τ, φ) where τ: V → A maps nodes to types and φ: E → R maps edges to types.** E-commerce example: A = {User, Item, Category, Brand}, R = {views, purchases, belongs_to, makes}. Each (src_type, edge_type, dst_type) triplet is a canonical edge type. PyTorch Geometric's HeteroData class represents each canonical type separately — different node types have different feature dimensionalities and different message-passing rules.`,
      `**RGCN (Relational GCN, Schlichtkrull et al., 2018): separate weight matrix W_r for each relation type r.** Aggregation: h_v = σ(Σ_r Σ_{u∈N^r(v)} (1/c_{v,r}) W_r h_u). With |R| relation types and feature dimension d: |R| \xd7 d\xb2 parameters for relation weights alone. For 200 relation types and d=256: 200 \xd7 65,536 = 13M parameters. Rare relation types with < 1,000 training edges have insufficient gradient to learn a full d\xd7d matrix. Basis decomposition W_r = Σ_b a_{r,b} V_b with B shared basis matrices reduces parameters from O(|R|\xd7d\xb2) to O(B\xd7d\xb2) + O(|R|\xd7B) — essential at scale.`,
      `**Meta-paths define semantic traversal routes through the heterogeneous graph.** In an academic graph: Author→Paper→Author (APA, co-authorship), Author→Paper→Venue→Paper→Author (APVPA, same venue). Different meta-paths capture different semantic relationships between the same node pair. Meta-path-based methods (HAN) require domain experts to define which paths are semantically meaningful — this is a bottleneck that requires manual intervention when the domain changes.`,
      `**HAN (Heterogeneous Attention Network, Wang et al., 2019): two-level attention.** Node-level: GAT-style attention aggregating information within each meta-path's neighborhood. Semantic-level: soft weighting of different meta-path-based embeddings — which meta-path is more informative for this node? Final embedding is a weighted sum across meta-paths. Limitation: meta-paths must be defined manually, cannot be discovered end-to-end, and require domain expertise that may not transfer to new heterogeneous graph problems.`,
      `**HGT (Heterogeneous Graph Transformer, Hu et al., 2020): relation-specific attention without meta-paths.** Type-specific key/query/value projections for each (src_type, edge_type, dst_type) canonical triplet — a Transformer with relation-specific parameters. Learns which relation triplets are informative end-to-end without manual meta-path specification. Parameter growth is O(|A| \xd7 d\xb2) for shared weights plus O(|R| \xd7 d) for small relation-specific modifiers — substantially better than RGCN's O(|R| \xd7 d\xb2). The recommended default for new heterogeneous graph problems.`,
      `**Knowledge graph completion with GNNs: KG-specific GNN-based methods (RGCN + DistMult decoder) aggregate neighborhood context to produce rich entity embeddings before scoring (head, relation, tail) triples.** This outperforms pure embedding methods (TransE, RotatE) when entities have high-degree neighborhoods with informative context — the GNN incorporates entity context that TransE-style methods ignore. Underperforms on sparse KGs where most entities have few connections and neighborhood aggregation adds noise rather than signal.`,
      `**When to model heterogeneity explicitly vs homogenize: model explicitly when edge types carry fundamentally different semantic meaning (click vs purchase), when sufficient training data exists per relation type for separate parameters, or when the downstream task requires distinguishing relation types.** Homogenize when relation types are too numerous and rare (> 100 types, < 1,000 edges each), when type information can be encoded as edge features (one-hot type embedding added to edge features), or when a fast baseline is needed.`,
      `**Cold-start for rare node types: a new node type with no trained type-specific parameters cannot produce meaningful embeddings through type-specific projection matrices.** Solutions: transfer learning from the most similar existing type (initialize new type's parameters from that type's parameters); feature-based fallback (rely entirely on content features rather than structural parameters for the new type); continual learning with frozen shared weights and fine-tuned type-specific parameters only.`,
    ],
    checkQuestions: [
      {
        q: `You have a heterogeneous e-commerce graph with 10 node types and 25 edge types. RGCN would require 25 separate weight matrices. What problems does this cause and how does HGT address them?`,
        options: [
          `A) 25 weight matrices are manageable; the main problem is training time, which HGT solves by processing all edge types in parallel`,
          `B) 25 full W_r matrices give 25\xd7d\xb2 parameters (1.6M at d=256) — overparameterization and insufficient gradient for rare relation types; HGT uses node-type-specific linear projections plus small relation-specific attention modifiers, reducing parameters from O(|R|\xd7d\xb2) to O(|A|\xd7d\xb2) + O(|R|\xd7d) while learning relation importance end-to-end`,
          `C) The problem is memory — 25 matrices fit in GPU memory only for d≤128; HGT solves this by quantizing weight matrices to 8-bit precision`,
          `D) RGCN with 25 matrices is more expressive than HGT and should be preferred when sufficient training data is available for all relation types`,
        ],
        answer: `B`,
      },
      {
        q: `Meta-paths in HAN are defined manually. What is wrong with this, and how would you make meta-path selection data-driven?`,
        options: [
          `A) Manually defined meta-paths are always correct because domain experts know the graph semantics better than any automated method`,
          `B) Manual meta-paths require domain expertise that doesn't generalize when the graph evolves, have combinatorial explosion with many types, and may miss non-obvious important paths; data-driven alternatives include HGT (learns relation-triplet importance without meta-paths), automatic meta-path discovery with sparsity regularization, or HeCo using contrastive learning on meta-path views`,
          `C) The only problem with manual meta-paths is efficiency — automated discovery always finds the same paths as domain experts but faster`,
          `D) Manual meta-paths are only problematic for temporal graphs; for static heterogeneous graphs they are the correct approach`,
        ],
        answer: `B`,
      },
      {
        q: `In a knowledge graph with 1M entities and 500 relation types, how would you handle the scalability and rare-relation problems simultaneously?`,
        options: [
          `A) Filter out all relation types with fewer than 10,000 edges before training — rare relations are too noisy to model`,
          `B) Use RGCN basis decomposition (W_r = Σ_b a_{rb} V_b with B=40 shared bases, reducing parameters ~12\xd7); use mini-batch training with relation-stratified sampling; cluster semantically similar relations and share parameters within clusters; pad rare relations with rule-based synthetic triples`,
          `C) Train a separate model per relation type — this avoids both scalability issues and rare-relation problems through specialization`,
          `D) Use a TransE embedding model instead of a GNN — embedding methods scale better than GNNs for knowledge graphs with many relation types`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Heterogeneous graphs are the production default, not the exception. The key architecture decision is RGCN (relation-specific full weight matrices, O(|R|\xd7d\xb2) parameter growth) vs HGT (relation-specific attention with shared weights, linear parameter growth). With 25+ relation types and d=256, RGCN's parameter count becomes infeasible for rare relation types that have insufficient training signal; HGT's shared weights with type-specific modifiers handle this gracefully. Basis decomposition is non-optional for RGCN at scale — reducing O(|R|\xd7d\xb2) to O(B\xd7d\xb2) + O(|R|\xd7B) provides ~12\xd7 parameter reduction at d=256 with B=40.`,
  },
  {
    id: 'gnn_applications',
    title: 'GNNs in Production at Scale',
    subtitle: 'PinSage, fraud detection, drug discovery, dynamic graphs, feature engineering, real-time inference',
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['PinSage', 'Pinterest', 'fraud detection', 'drug discovery', 'dynamic graphs', 'production', 'real-time GNN'],
    interactivePrompt: `Before you touch the controls: a drug molecule and a protein target are both graphs — atoms and bonds, residues and contacts. You want to predict whether the drug will bind to the protein. Neither graph has a fixed size. What architecture would you use to get a fixed-size representation from each, and how would you combine them to make a binding prediction?`,
    summary: `A drug molecule has atoms as nodes and bonds as edges. A protein has residues as nodes and spatial contacts as edges. You want to predict whether the drug binds to the protein — a graph-graph matching problem. Hand-crafted features (molecular fingerprints, protein descriptors) have been used for this task for decades. But the features must be designed by domain experts, they are fixed at design time, and they discard structural information that doesn't fit the feature schema. GNNs learn task-specific representations directly from the molecular graph, capturing the geometric and chemical compatibility between drug and protein that hand-crafted features miss.

This is the general pattern for GNN applications: wherever entities have structure (molecules, proteins, social networks, knowledge graphs, circuit layouts) and tasks depend on that structure, GNNs outperform feature-engineering approaches by learning the relevant structural representation end-to-end.

Moving a GNN from an academic benchmark to production exposes problems that benchmark papers omit: graphs with billions of edges, millisecond latency requirements, continuous updates that invalidate cached embeddings, and predictions that must be explainable to analysts. PinSage (Ying et al., 2018) is the canonical case study — from a 2-layer GraphSAGE prototype to a system serving 2 billion users. Its most important innovations are not architectural: random walk importance sampling, MapReduce offline embedding computation, and ANN serving are the engineering decisions that made billion-scale GNN deployment feasible.

**NOT this.** "GNNs are only used for node classification." GNNs support node classification (protein function prediction), link prediction (friend recommendation, drug-target interaction), graph classification (molecule property, circuit quality), and graph generation (drug design). The readout function changes — per-node output for node classification, pair scoring for link prediction, global pooling for graph classification — but the message-passing backbone is the same. The drug-target binding task above is a graph-graph matching problem that uses GNN encoders on both graphs plus cross-attention for compatibility scoring.`,
    keyPoints: [
      `**PinSage (Pinterest, 2018): 2B pins, 18B edges on a pin-board bipartite graph.** Full-batch GCN impossible — infeasible at any node count near 2B. Solution: random walk-based neighborhood sampling — run 100 random walks of length 5 from each pin; use the top-K most frequently visited pins as the neighborhood. This captures second-order proximity and is more robust than uniform sampling because popular boards don't dominate the neighborhood — pins visited via multiple distinct short walks get higher weight than pins reachable through a single high-degree hub.`,
      `**PinSage scalability stack: offline embedding via MapReduce pipeline (GPU machines compute mini-batch embeddings, written to RocksDB); online serving via FAISS ANN on precomputed embeddings (< 10ms for top-1,000 similar pins); curriculum training starting with easy random negatives and progressively using semantically hard negatives from the embedding space.** This infrastructure stack — not the GNN architecture — is what makes 2B-pin scale work. The architecture is 2-layer GraphSAGE.`,
      `**Fraud detection on transaction networks: nodes = users + merchants, edges = transactions with features (amount, time, merchant category, device ID).** Key challenges: temporal causality (training must never use features from future timestamps), adversarial adaptation (fraudsters change patterns after detection), and ring structure as a fraud signal (fraudsters create A→B→C→A cycles). Structural features like betweenness centrality and cycle count often provide stronger signals than node content features alone.`,
      `**Drug discovery: atoms as nodes (atomic number, charge, hybridization), bonds as edges (bond type, aromaticity).** Tasks: molecular property prediction, drug-target binding affinity, reaction yield. Datasets are small (1K–100K molecules). Solution: pretrain on large unlabeled molecular databases (ZINC, ChEMBL) then fine-tune — SSL pretraining provides the 10\xd7 labeled data reduction that makes molecular GNNs practical. Used in AlphaFold's structural inputs and property-prediction pipelines at major pharmaceutical companies.`,
      `**Dynamic graphs in production: most production graphs change continuously — new users sign up, transactions occur every second, friendships form and dissolve.** Three approaches: (1) Snapshot-based — retrain or update a static GNN on graph snapshots at regular intervals; simple but misses inter-snapshot dynamics. (2) TGAT (Temporal Graph Attention): embeddings are functions of node features plus temporal encodings of event timestamps, Transformer-style. (3) TGN (Temporal Graph Network): nodes carry memory states updated by each new interaction, capturing long-term user behavior across batches. TGN is the production standard for real-time recommendation.`,
      `**Real-time GNN inference latency: a 2-layer GNN for a user with 1,000 connections, each with 1,000 connections, requires 1M feature lookups per inference.** This is 100ms at sub-millisecond Redis latency — too slow for real-time ranking. Production solution: precompute and cache 1-hop aggregations nightly; update cache on new edges via event-driven invalidation. Decouple feature store freshness (updated every minute) from embedding freshness (recomputed every few hours). The two are different concerns with different latency requirements.`,
      `**Feature engineering often beats architecture improvements in practice.** Structural features beyond node content: degree (in and out separately for directed graphs), clustering coefficient, PageRank or personalized PageRank, Node2Vec topology embeddings, temporal features (average edge age, edge creation rate in last 7/30/90 days). These can be precomputed and added as node features, giving the GNN access to higher-order structural information without adding depth — and without the over-smoothing risk that depth adds.`,
      `**Production serving infrastructure pattern: feature store (Redis/RocksDB, sub-millisecond lookup) + graph store (adjacency lists in distributed key-value store) + embedding store (FAISS index for ANN) + batch recompute pipeline (Spark + GPU workers for hourly/daily refresh) + event stream (Kafka for real-time edge additions, triggering embedding refresh for high-priority nodes).** The GNN model is often deployed unchanged for months; embedding quality degrades more from stale graph data than from model staleness.`,
    ],
    checkQuestions: [
      {
        q: `You are the ML lead for friend recommendations at a social network with 500M users. Design a GNN system end-to-end, from data pipeline to serving. What are the top 3 engineering challenges?`,
        options: [
          `A) Use full-batch spectral GCN on the daily graph snapshot; the top 3 challenges are GPU memory, training time, and label quality`,
          `B) GraphSAGE 2-layer with SIGN precomputed aggregations for offline batch embeddings; FAISS ANN for serving; top 3 challenges are embedding staleness (new users/edges invisible for up to 24h), training-serving distribution shift (active users requesting recommendations differ from average), and feedback loop bias (recommendations affect which edges form, biasing future training data)`,
          `C) Use a matrix factorization baseline first; GNNs are only needed if matrix factorization fails; the top 3 challenges are cold start, scalability, and negative sampling`,
          `D) Use TGN for real-time updates on all 500M users; the top 3 challenges are memory management, Kafka throughput, and graph partitioning`,
        ],
        answer: `B`,
      },
      {
        q: `PinSage uses random walks to define "neighborhoods" rather than direct graph neighbors. Why? What problem does this solve?`,
        options: [
          `A) Random walks are used because direct neighbors require graph traversal, which is slower than random walk statistics`,
          `B) Pinterest's bipartite graph has popular boards with 100K+ pins — uniform sampling would over-weight them; random walk visit frequency naturally weights pins by how many distinct short paths connect them to the query pin, down-weighting hub boards and up-weighting niche co-occurrence; also bounds neighborhood size via top-K selection`,
          `C) Random walks produce better embeddings because they capture long-range dependencies that direct neighbor aggregation misses`,
          `D) Random walks are used to handle cold-start pins that have no direct neighbors in the graph`,
        ],
        answer: `B`,
      },
      {
        q: `A fraud detection GNN achieves 99% AUC in offline evaluation but only 70% precision at 10% recall in production. Diagnose at least 3 possible causes.`,
        options: [
          `A) The gap is caused by class imbalance — 99% AUC at 0.1% fraud rate is inflated; the production metric (precision@recall) is the correct one, so retrain with a different loss function`,
          `B) Three causes: (1) temporal leakage in training (random transaction splits let fraud ring members appear in both train and test — fix with time-based splits); (2) adversarial adaptation (fraudsters changed behavior post-detection — retrain monthly with recent data); (3) graph feature leakage (structural features computed on full graph including future edges — use temporal graph construction with features at time T only)`,
          `C) The gap is caused by production serving latency — 70% precision means the model times out and falls back to a weaker baseline in production`,
          `D) 99% AUC offline with poor production precision means the validation set is too small; increase to 20% holdout and the production gap will close`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `PinSage is the definitive case study for production GNNs at scale: 2B nodes, 18B edges, sub-10ms serving latency. Its innovations — random walk-based neighborhood importance sampling, MapReduce offline embedding computation, and ANN retrieval — collectively solve the three hard production problems: neighborhood explosion, embedding staleness, and low-latency inference. The practical lesson is that a production GNN system is not one model but a pipeline — feature store, graph store, batch embedding computation, ANN index, and event-driven cache invalidation are all load-bearing components, and the GNN model itself is often the least complex part of the system.`,
  },
]
