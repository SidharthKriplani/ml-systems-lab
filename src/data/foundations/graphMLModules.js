export const GRAPH_ML_MODULES = [
  {
    id: 'graph_representations',
    interactiveId: 'gnn_message_passing_viz',
    title: 'Graphs as ML Data Structures',
    subtitle: 'Adjacency formats, task types, permutation invariance, homophily, inductive vs transductive',
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['graph', 'adjacency', 'CSR', 'homophily', 'permutation invariance', 'transductive'],
    interactivePrompt: `Before you touch the controls: a fraud detection system has 50 million users as nodes and 5 billion transactions as edges. A user who received money from 5 known fraud accounts last week is a high-risk signal — but only if you can see the graph. What would a standard feature vector per user miss, and why?`,
    summary: `A fraud detection system has 50 million users and 5 billion transactions. A user who received money from 5 confirmed fraud accounts last week is almost certainly a fraud risk. But your ML model takes a feature vector per user — age, account balance, transaction volume. None of those features capture "connected to known fraudsters." The signal is real, it is strong, and it is invisible unless you model the graph structure. This is why graph ML exists.

Graphs appear wherever relationships between entities carry information: molecular property prediction (atoms as nodes, bonds as edges), citation networks (papers as nodes, citations as edges), knowledge graphs (entities as nodes, relations as edges), social recommendations. In each case, the graph structure encodes relational signals that a per-node feature vector cannot represent. Graph ML extracts that signal.

Before any model runs, you need the right data structure. A 50M-node social graph stored as a dense adjacency matrix requires 50M × 50M entries at 1 bit each: 312 terabytes. Stored as a CSR (Compressed Sparse Row) sparse matrix with only the 5B actual edges, it requires about 40 gigabytes. This is not a detail — it is the difference between a system that is buildable and one that is not.

[FIGURE:adjacency]

Beyond data structures, graph tasks split into three types. Node-level tasks (fraud detection, protein function prediction) require a prediction per node, using each node's final embedding directly. Edge-level tasks (link prediction, drug-target interaction) require a prediction per edge, typically from a decoder applied to the two endpoint embeddings. Graph-level tasks (molecular property prediction) require one prediction for the entire graph, using a readout function that aggregates all node embeddings into a fixed-size vector.

**NOT this.** "Graphs are just for network analysis." Graphs appear wherever entities have relationships that carry information: molecular property prediction where the graph is a molecule, recommendation systems where the graph connects users to items, knowledge graphs that power QA systems, traffic routing where roads are edges. Any problem with entities and relations between them is potentially a graph problem. The question is whether the relational structure contains signal that a per-entity feature vector would miss — and in most domains, it does.`,
    keyPoints: [
      `**Dense adjacency matrix A ∈ {0,1}^{NxN}: stores all N\xb2 entries regardless of edge count.** O(N\xb2) memory. Efficient only for dense graphs (|E| ≈ N\xb2). For a social graph with N=50M nodes: 50M\xd750M = 2.5\xd710^{15} entries, ~312 TB even at 1 bit per entry. GCN on full adjacency requires O(N\xb2) memory even at inference. Never use for large sparse graphs.`,
      `**CSR (Compressed Sparse Row): stores only nonzero entries in three arrays — values (edge weights), col_indices (column of each entry), row_ptr (start of each row in col_indices).** Memory O(|E| + |V|). For a 50M-node graph with 5B edges: ~40 GB. SpMM (sparse \xd7 dense matrix multiply) is the core GNN operation — PyTorch Geometric and DGL both build on this. Message passing on CSR is naturally parallel across edges, which maps directly to GPU execution.`,
      `**Node-level, edge-level, and graph-level tasks require fundamentally different output structures.** Node-level (fraud detection, protein function): each node gets a prediction, using the node's final embedding directly. Edge-level (link prediction, knowledge graph completion): each edge gets a prediction, typically from a decoder applied to the two endpoint embeddings. Graph-level (molecular property, circuit quality): the entire graph gets a prediction, requiring a readout function that aggregates all node embeddings into a fixed-size vector.`,
      `**Standard NNs cannot be applied to graphs for two reasons: variable input size (graphs differ in |V| and |E|), and no canonical node ordering — the same node appears at index 3 in one ordering and index 87 in another.** Permutation invariance requires f(PAP^T, Px) = f(A, x) for any permutation matrix P. An MLP applied to a flattened adjacency matrix is not permutation invariant — different orderings of the same graph produce different outputs.`,
      `**Graph signal processing gives structural intuition: node features are signals on the graph.** The graph Laplacian L = D - A captures discrete gradient structure. Multiplying by L computes the difference between each node's feature and its neighbors' mean — a high-pass filter that amplifies differences. GCN aggregation with self-loops is a low-pass filter that smooths features across edges. Stacking too many GCN layers over-smooths features to the point where all nodes become indistinguishable; residual/skip connections (carrying each layer's input forward) or simply keeping depth shallow (2–4 layers) are the standard fixes.`,
      `**Homophily vs heterophily determines whether mean aggregation helps or hurts.** In homophilic graphs (social networks — connected nodes have similar properties), standard GNNs that average neighbor features work well because neighbors have informative features. In heterophilic graphs (fraud ring members connect to victims, bipartite recommendation graphs), mean aggregation destroys the discriminative signal because the fraudster's neighbors are predominantly legitimate. H2GCN addresses this by keeping the ego node's embedding separate from aggregated neighbor features, and by aggregating 1-hop and 2-hop neighborhoods separately and concatenating them rather than mixing all distances together — heterophilic signal often shows up more strongly at 2 hops than at 1.`,
      `**Inductive vs transductive is an architectural commitment with production consequences.** Transductive GNNs (spectral methods, vanilla GCN) train and test on the same fixed graph — they cannot generate embeddings for unseen nodes without retraining. In production, new users and items arrive continuously. GraphSAGE, GAT, and spatial methods learn aggregation functions that apply to any neighborhood, making them inductive by design. Anything requiring full graph retraining to embed new nodes is not deployable.`,
      `**Heterogeneous graphs are the production default.** Multiple node types (user, item, category) and edge types (click, purchase, co-viewed) are the norm in e-commerce and knowledge graphs. Homogeneous GNNs that ignore type information discard the relational semantics that distinguish a click from a purchase — which are often the most commercially important signals. Modeling heterogeneity is not an advanced feature; ignoring it is a lossy baseline.`,
    ],
    checkQuestions: [
      {
        q: `You have a social network with 50M users and 5B edges. Explain concretely why you cannot use a standard dense adjacency matrix, and what data structure you would use instead.`,
        options: [
          `A) Dense adjacency works if you quantize each entry to 2-bit fixed point and shard the matrix across 64 GPUs with NCCL all-reduce for every lookup`,
          `B) Dense adjacency needs ~312 TB even at 1 bit per entry — infeasible; use CSR, which stores only the 5B real edges (~40 GB) and maps directly to sparse matrix multiply`,
          `C) Dense adjacency is fine for 50M nodes on a distributed file system like HDFS with 3x replication and erasure coding — storage isn't a practical concern at this scale for training`,
          `D) Use a dense adjacency matrix but restrict training to a random 1% of nodes per epoch via reservoir sampling, which keeps peak memory usage safely under 8 GB per worker node`,
        ],
        answer: `B`,
      },
      {
        q: `Explain what permutation invariance means for a graph neural network, and show why a 2-layer MLP applied to the flattened adjacency matrix is not permutation invariant.`,
        options: [
          `A) Permutation invariance means output is unchanged regardless of node feature values; MLP fails this because it is sensitive to feature magnitude, not node order`,
          `B) It means f(PAP^T, PX) = f(A, X) for any permutation P; a flattened-A MLP fails since two node orderings give different vectors and outputs`,
          `C) MLPs become permutation invariant once input features are L2-normalized and zero-centered before the adjacency matrix is flattened into the input feature vector`,
          `D) Permutation invariance only applies to graph-level readout functions; node-level MLPs are fully exempt because each node occupies a fixed matrix row index`,
        ],
        answer: `B`,
      },
      {
        q: `Your GNN for citation network node classification achieves 85% accuracy with 2 layers, but drops to 60% with 8 layers. What is happening and how do you fix it?`,
        options: [
          `A) 8-layer GNNs need a 10x larger learning rate to converge; the drop is a pure optimization instability, not a structural property of the aggregation`,
          `B) Over-smoothing: each layer is a low-pass filter, so 8 layers make embeddings converge to nearly one vector; fix with residual connections or shallow 2-4 layer depth`,
          `C) 8 layers cause overfitting from excess capacity; halving the hidden dimension while keeping the full 8 layers fully resolves the accuracy drop on this exact benchmark`,
          `D) The citation network has too few nodes for 8-layer GNNs; this depth requires graphs with at least several million labeled nodes to converge properly at all`,
        ],
        answer: `B`,
      },
      {
        q: `Which two of the following statements about heterophilic graphs and GNN aggregation are TRUE? (Select two.)`,
        options: [
          `A) Standard mean/sum aggregation destroys the ego node's discriminative signal in heterophilic graphs because neighbors carry differing labels and averaging blends them away`,
          `B) H2GCN handles heterophily by keeping the ego embedding separate from neighbor aggregations and concatenating 1-hop and 2-hop neighborhoods rather than mixing them together`,
          `C) Standard GNNs fail on heterophilic graphs only because they cannot process graphs containing more than two distinct node types in the input schema`,
          `D) Heterophilic and homophilic graphs are handled identically well by all GNN variants — any performance gap traces to feature quality, never to the aggregation choice`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `The constraint that makes GNNs fundamentally different from every other neural network is permutation invariance — the same graph admits N! adjacency matrix representations, so any valid GNN must aggregate neighbor features with a permutation-invariant function (sum, mean, max). Everything else in GNN design follows from this constraint. In production, the adjacency matrix format is not a detail: for a 50M-node social graph, the choice between dense (312 TB) and CSR (~40 GB) determines whether the system is buildable at all.`,
    recap: [
      `**Graph ML exists for relational signal:** "connected to known fraudsters" is invisible to a per-node feature vector.`,
      `**Dense adjacency is O(N²):** 50M nodes → ~312 TB. **CSR** stores only edges → ~40 GB. Format decides buildability.`,
      `**Three task types:** node-level (per-node embedding), edge-level (decoder on 2 endpoints), graph-level (readout aggregates all nodes).`,
      `**Permutation invariance is the defining constraint:** N! orderings → aggregate with sum/mean/max; MLP on flattened $A$ is not invariant.`,
      `**Homophily → mean aggregation helps; heterophily → it destroys signal** (fraud rings connect to victims).`,
      `**Inductive vs transductive is a deployment commitment:** vanilla GCN can't embed unseen nodes; GraphSAGE/GAT can.`,
      `**Heterogeneous graphs are the production default** — ignoring node/edge types is a lossy baseline.`,
    ],
    figures: {
      adjacency: `<svg viewBox="0 0 360 116" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="8">Graph (4 nodes, 4 edges)</text>
  <line x1="40" y1="46" x2="92" y2="30" stroke="var(--rim)" stroke-width="1.5"/>
  <line x1="40" y1="46" x2="92" y2="78" stroke="var(--rim)" stroke-width="1.5"/>
  <line x1="92" y1="30" x2="92" y2="78" stroke="var(--rim)" stroke-width="1.5"/>
  <line x1="92" y1="78" x2="40" y2="96" stroke="var(--rim)" stroke-width="1.5"/>
  <circle cx="40" cy="46" r="10" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="40" y="49" text-anchor="middle" fill="var(--ink-hi)" font-size="8">0</text>
  <circle cx="92" cy="30" r="10" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="92" y="33" text-anchor="middle" fill="var(--ink-hi)" font-size="8">1</text>
  <circle cx="92" cy="78" r="10" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="92" y="81" text-anchor="middle" fill="var(--ink-hi)" font-size="8">2</text>
  <circle cx="40" cy="96" r="10" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="40" y="99" text-anchor="middle" fill="var(--ink-hi)" font-size="8">3</text>
  <text x="150" y="12" fill="var(--ink-low)" font-size="8">Dense A (N x N)</text>
  <text x="150" y="102" fill="var(--ink-low)" font-size="7">O(N&#178;) &#8594; 50M nodes &#8776; 312 TB</text>
  <g font-size="8" fill="var(--ink-mid)" text-anchor="middle">
  <text x="160" y="34">0</text><text x="176" y="34">1</text><text x="192" y="34">1</text><text x="208" y="34">0</text>
  <text x="160" y="50">1</text><text x="176" y="50">0</text><text x="192" y="50">1</text><text x="208" y="50">0</text>
  <text x="160" y="66">1</text><text x="176" y="66">1</text><text x="192" y="66">0</text><text x="208" y="66">1</text>
  <text x="160" y="82">0</text><text x="176" y="82">0</text><text x="192" y="82">1</text><text x="208" y="82">0</text>
  </g>
  <text x="252" y="12" fill="#22c55e" font-size="8">CSR (edges only)</text>
  <text x="252" y="30" fill="var(--ink-mid)" font-size="7">row_ptr [0,2,4,7,8]</text>
  <text x="252" y="44" fill="var(--ink-mid)" font-size="7">col_idx [1,2,0,2,0,1,3,2]</text>
  <text x="252" y="66" fill="#22c55e" font-size="7">O(|E|+|V|)</text>
  <text x="252" y="80" fill="#22c55e" font-size="7">50M nodes &#8776; 40 GB</text>
  <text x="252" y="102" fill="var(--ink-low)" font-size="7">buildable vs not</text>
</svg>`,
    },
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

[FIGURE:oversmooth]

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
          `A) K=1 restricts the receptive field to exactly 1 hop by construction; λ_max=2 is the exact maximum eigenvalue proven to hold for every normalized graph Laplacian`,
          `B) Start from ChebNet K=2, set θ₀=-θ₁=θ, add self-loops (Ã=A+I) — yields H^{l+1}=σ(D̃^{-1/2}ÃD̃^{-1/2}H^lW^l); K=1 cuts params; λ_max≈2 avoids spectral radius computation`,
          `C) K=1 is the smallest value that still enables multi-hop aggregation across the full input graph; λ_max=2 was tuned empirically against ImageNet classification benchmarks`,
          `D) λ_max=2 is an exact identity for all graphs under the definition of the normalized Laplacian; K=1 is chosen because higher-order terms add zero expressiveness`,
        ],
        answer: `B`,
      },
      {
        q: `Which two of the following statements about applying a spectral GCN to a NEW graph unseen at training time are TRUE? (Select two.)`,
        options: [
          `A) Spectral filters live in the training graph's Laplacian eigenspace, and a new graph has different eigenvectors, so a trained filter cannot transfer to it`,
          `B) The standard fix is to switch to a spatial message-passing GNN such as GraphSAGE or GAT, which learns aggregation functions rather than eigenspace filters`,
          `C) The problem is that new protein networks are too densely connected for spectral convolution; the fix is a random edge-dropping subsampling pass before training`,
          `D) There is no fundamental transfer problem — spectral GCN polynomial coefficients are graph-agnostic scalars that carry over cleanly to any new graph`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `What is over-smoothing in GCNs, and what is its formal spectral interpretation?`,
        options: [
          `A) Over-smoothing is when a GCN memorizes training node features exactly; its spectral interpretation is that training loss converges to a sharp degenerate minimum`,
          `B) All embeddings converge to one vector after many layers; the filter's eigenvalues in [0,1], raised to the L-th power, vanish except the dominant eigenvector`,
          `C) Over-smoothing occurs only on heterophilic graphs and never on homophilic ones; on homophilic graphs deep GCNs monotonically improve accuracy as more layers get stacked`,
          `D) Over-smoothing is purely a gradient-vanishing problem; its spectral account is that small eigenvalues zero out gradients before they reach the lowest layers`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The Kipf & Welling GCN is a first-order Chebyshev polynomial approximation that avoids eigendecomposition — this is what made spectral GCNs tractable. But the approximation doesn't fix the transductive limitation: spectral filters are defined in the eigenspace of a specific graph's Laplacian and cannot transfer to graphs not seen during training. This is why all production GNN systems use spatial message-passing methods — inductive generalization to new nodes and graphs is a hard requirement, not an optimization, and spectral methods cannot satisfy it.`,
    recap: [
      `**Graph structure carries signal:** citation net → MLP 56% vs GCN 81%, +25pp from structure alone.`,
      `**Spectral convolution = filter in Laplacian eigenspace:** $L = D - A$, eigenvectors are the graph Fourier basis.`,
      `**Eigendecomposition is O(N³) — infeasible.** ChebNet approximates filters with degree-K Chebyshev polynomials → sparse matmuls, no eigenvectors.`,
      `**Kipf & Welling GCN = K=1 ChebNet:** $H^{(l+1)} = \\sigma(\\tilde{D}^{-1/2}\\tilde{A}\\tilde{D}^{-1/2}H^{(l)}W^{(l)})$ — one sparse matmul/layer.`,
      `**Renormalization trick:** self-loops ($\\tilde{A}=A+I$) before normalization fix degree-zero nodes and improve gradient flow.`,
      `**Spectral filters can't transfer:** weights tied to the training graph's Laplacian → transductive only.`,
      `**Over-smoothing:** low-pass filter to the L-th power collapses embeddings to the dominant eigenvector.`,
    ],
    figures: {
      oversmooth: `<svg viewBox="0 0 360 104" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="8">Each GCN layer = low-pass filter (eigenvalues in [0,1]) &#8594; raised to the L-th power</text>
  <text x="40" y="30" text-anchor="middle" fill="var(--ink-mid)" font-size="8">L = 2</text>
  <circle cx="24" cy="52" r="8" fill="#22c55e"/><circle cx="44" cy="44" r="8" fill="var(--prime)"/><circle cx="34" cy="70" r="8" fill="var(--amber)"/><circle cx="56" cy="66" r="8" fill="#ef4444"/>
  <text x="40" y="94" text-anchor="middle" fill="#22c55e" font-size="7">distinct</text>
  <text x="160" y="30" text-anchor="middle" fill="var(--ink-mid)" font-size="8">L = 4</text>
  <circle cx="144" cy="52" r="8" fill="#7c9c6b"/><circle cx="164" cy="44" r="8" fill="var(--prime)"/><circle cx="154" cy="70" r="8" fill="#9a8f5c"/><circle cx="176" cy="66" r="8" fill="#b06b5c"/>
  <text x="160" y="94" text-anchor="middle" fill="var(--amber)" font-size="7">blurring</text>
  <text x="290" y="30" text-anchor="middle" fill="var(--ink-mid)" font-size="8">L = 8</text>
  <circle cx="274" cy="52" r="8" fill="var(--ink-low)"/><circle cx="294" cy="44" r="8" fill="var(--ink-low)"/><circle cx="284" cy="70" r="8" fill="var(--ink-low)"/><circle cx="306" cy="66" r="8" fill="var(--ink-low)"/>
  <text x="290" y="94" text-anchor="middle" fill="#ef4444" font-size="7">collapsed (85% &#8594; 60%)</text>
  <path d="M92,66 l40,0" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#os)"/>
  <path d="M212,66 l50,0" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#os)"/>
  <defs><marker id="os" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
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

[FIGURE:sampling]

The aggregation function choice matters. Mean aggregation treats all neighbors equally. Max-pooling picks the most activated feature across neighbors — useful when a few neighbors carry strong signal and the rest are noise. LSTM aggregation has higher capacity but breaks permutation invariance, which is a theoretical violation for graph learning.

**NOT this.** "GraphSAGE requires full-batch training." GraphSAGE was specifically designed for mini-batch training by sampling a fixed number of neighbors at each hop. Full-batch GCN requires the entire adjacency matrix in memory — infeasible for graphs with billions of nodes. GraphSAGE's fixed fan-out sampling is the mechanism that enables mini-batch training: a batch of 512 target nodes with sample sizes [25, 10] requires loading at most 512 + 12,800 + 128,000 = 141,312 nodes from the feature store, regardless of graph size. The architecture is designed around this constraint.`,
    keyPoints: [
      `**GraphSAGE algorithm: for each node v, (1) sample a fixed-size neighborhood N(v) from the full neighbor set, (2) aggregate sampled neighbor features h_N(v) = AGGREGATE({h_u : u ∈ N(v)}), (3) concatenate ego + aggregated h_v = σ(W · CONCAT(h_v, h_N(v))).** Repeat for K layers. After K layers, each node's embedding encodes its K-hop neighborhood. The same W and aggregation function apply to every node at every layer — generalization is structural, not node-specific.`,
      `**Neighbor sampling controls the otherwise exponential neighborhood expansion.** Without sampling, a K-layer GNN on a node with 100 average-degree neighbors requires 100 1-hop, 10,000 2-hop, and 1M 3-hop neighbors. GraphSAGE samples a fixed |S_1| neighbors at hop 1, |S_2| at hop 2 — bounded computation per node. Sample sizes [25, 10] cap the computation at 250 nodes per target node for a 2-layer embedding, regardless of actual node degree.`,
      `**Mean aggregator: h_N(v) = σ(W · MEAN({h_u : u ∈ N(v) ∪ {v}})).** Equivalent to GCN's normalized aggregation without self-loops. Simple and effective, but treats all neighbors equally. Concatenating the ego embedding (CONCAT(ego, MEAN(neighbors))) rather than replacing it with the mean outperforms pure mean by preserving the central node's own identity — a node in a neighborhood of high-degree hubs has different properties than the hubs themselves.`,
      `**LSTM aggregator: applies an LSTM to a random permutation of neighbor features.** Empirically outperforms mean on some tasks despite being theoretically incorrect — LSTM is not permutation invariant, so different random orderings at inference give different embeddings. The LSTM may be exploiting a useful but spurious signal from node ID-based orderings. Use max-pooling if you want both good empirical performance and the theoretical correctness required by GNN theory.`,
      `**Max-pooling aggregator: h_N(v) = max({σ(W_pool · h_u + b) : u ∈ N(v)}).** Applies elementwise max after a learned transformation. Captures the most activated feature across neighbors — useful when some neighbors are highly informative and most are noise. Often the best performer for node classification on heterophilic graphs where the most anomalous neighbor, not the average neighbor, carries the signal.`,
      `**Inductivity is the architectural insight that separates GraphSAGE from prior methods.** Spectral GCN is trained with the full graph adjacency — its weights are tied to the specific graph via spectral filtering. GraphSAGE learns aggregation functions that map neighborhood features to embeddings — the same function applies to any neighborhood. New nodes: sample their neighbors, run the K-layer aggregation with trained weights, get an embedding in milliseconds. No retraining, no graph reconstruction.`,
      `**PinSage (Pinterest) is the reference production implementation: random-walk-based neighborhood sampling instead of uniform sampling (nodes visited more frequently in random walks from v are higher-weight neighbors); feature store (Redis/RocksDB) and graph store (adjacency lists) as separate systems; offline embedding computation via MapReduce; online serving via approximate nearest neighbor (FAISS/ScaNN).** The architecture — not the GNN itself — is what makes 3B-pin scale feasible.`,
      `**Mini-batch training computation: for a batch of target nodes, expand neighborhoods layer by layer.** For K=2 with sample sizes [25, 10]: a batch of 512 target nodes requires ~512\xd725 = 12,800 1-hop nodes and ~12,800\xd710 = 128,000 2-hop nodes. These nodes are fetched from a feature store, with neighborhood structure from a graph database. The feature lookup latency, not the GNN forward pass, dominates total training time at scale.`,
    ],
    checkQuestions: [
      {
        q: `A 3-layer GraphSAGE with neighbor sample sizes [15, 10, 5] is used to embed a batch of 256 target nodes. How many total nodes might be loaded from the feature store in the worst case?`,
        options: [
          `A) 256 \xd7 (15 + 10 + 5) = 7,680 nodes, since sample sizes are summed rather than multiplied across the three sampling depths`,
          `B) Worst case (no overlap): 256 + 3,840 (depth-1, 256\xd715) + 38,400 (depth-2, 3,840\xd710) + 192,000 (depth-3, 38,400\xd75) = 234,496 nodes; overlap in dense graphs reduces this in practice`,
          `C) Exactly 256 \xd7 15 \xd7 10 \xd7 5 = 192,000 nodes total, because all three sampling levels are always fully expanded as one single combined multiplicative product`,
          `D) The worst case is 256 \xd7 max(15,10,5) = 3,840 nodes, because only the single widest sampling layer contributes meaningfully to peak feature-store memory usage`,
        ],
        answer: `B`,
      },
      {
        q: `Your GraphSAGE model is trained on a social network. A new user signs up with 3 connections to existing users. How do you compute their embedding without retraining?`,
        options: [
          `A) You cannot embed the new user at all without retraining — GraphSAGE, like spectral GCN, requires full graph reconstruction for any new node`,
          `B) Run the forward pass inductively: fetch the 3 neighbors' features, sample their neighbors, run K-layer aggregation with trained weights; fall back to ego-only if isolated`,
          `C) Use the average embedding of all existing users as a placeholder for the new user until the next scheduled weekly retraining cycle completes`,
          `D) Insert the new user into the adjacency matrix and run one forward pass of the full spectral GCN over the entire updated graph, ignoring the 3 declared connections entirely`,
        ],
        answer: `B`,
      },
      {
        q: `Which two of the following statements about the LSTM aggregator in GraphSAGE are TRUE? (Select two.)`,
        options: [
          `A) LSTM is not permutation invariant — neighbor ordering changes the output, which formally violates the aggregation requirement for a valid GNN`,
          `B) Despite the theoretical flaw, LSTM can still be empirically useful because random orderings during training act as augmentation and higher capacity helps some tasks`,
          `C) LSTM is flawed mainly because it has too many parameters relative to mean aggregation, which reliably causes overfitting on any graph dataset`,
          `D) LSTM aggregators are actually permutation invariant by design — the recurrence gate structure cancels out any dependence on neighbor input order`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `GraphSAGE's key innovation is learning an aggregation function rather than node embeddings — the same function applies to any neighborhood, so previously unseen nodes get embeddings by running the same procedure without any retraining. This inductivity is the non-negotiable requirement for production deployment where new nodes arrive continuously. Neighbor sampling (fixed fan-out per hop) solves the second key problem: the exponential neighborhood explosion that makes full-batch K-layer GNNs intractable on graphs with more than ~100K nodes.`,
    recap: [
      `**GraphSAGE learns an aggregation function, not fixed embeddings** — same function embeds unseen nodes in ms, no retraining.`,
      `**Inductivity is the point:** new pins arrive daily; spectral GCN needs full-graph retrain, GraphSAGE doesn't.`,
      `**Neighbor explosion:** deg-100, K=3 → up to 1M nodes. Fixed fan-out [25,10] caps at 250/target.`,
      `**Algorithm:** sample $N(v)$ → aggregate → concat ego + neighbors → repeat K layers.`,
      `**Aggregators:** mean (equal weight), max-pool (strongest neighbor), LSTM (higher capacity but breaks permutation invariance).`,
      `**Concat ego, don't replace with mean** — preserves the central node's identity vs its hubs.`,
      `**PinSage = production reference:** random-walk sampling, separate feature/graph stores, MapReduce offline embeddings, ANN serving.`,
    ],
    figures: {
      sampling: `<svg viewBox="0 0 360 110" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="8">Fixed fan-out caps the neighbor explosion: sample [25, 10] not all</text>
  <circle cx="40" cy="60" r="11" fill="var(--prime)"/><text x="40" y="63" text-anchor="middle" fill="var(--ink-hi)" font-size="8">v</text>
  <text x="40" y="88" text-anchor="middle" fill="var(--ink-low)" font-size="7">target</text>
  <g stroke="var(--prime)" stroke-width="1.3">
  <line x1="51" y1="54" x2="150" y2="24"/><line x1="51" y1="58" x2="150" y2="46"/><line x1="51" y1="62" x2="150" y2="68"/><line x1="51" y1="66" x2="150" y2="90"/>
  </g>
  <g fill="var(--prime-faint)" stroke="var(--prime)"><circle cx="158" cy="24" r="8"/><circle cx="158" cy="46" r="8"/><circle cx="158" cy="68" r="8"/><circle cx="158" cy="90" r="8"/></g>
  <text x="158" y="106" text-anchor="middle" fill="var(--prime)" font-size="7">hop 1: 25</text>
  <g stroke="var(--rim)" stroke-width="1"><line x1="166" y1="24" x2="250" y2="16"/><line x1="166" y1="24" x2="250" y2="34"/><line x1="166" y1="68" x2="250" y2="60"/><line x1="166" y1="90" x2="250" y2="98"/></g>
  <g fill="var(--depth)" stroke="var(--rim)"><circle cx="256" cy="16" r="6"/><circle cx="256" cy="34" r="6"/><circle cx="256" cy="60" r="6"/><circle cx="256" cy="98" r="6"/></g>
  <text x="256" y="112" text-anchor="middle" fill="var(--ink-low)" font-size="7">hop 2: 10</text>
  <text x="304" y="48" fill="#22c55e" font-size="8" font-weight="700">&#8804; 250</text>
  <text x="304" y="62" fill="var(--ink-low)" font-size="7">per target,</text>
  <text x="304" y="74" fill="var(--ink-low)" font-size="7">any degree</text>
</svg>`,
    },
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

[FIGURE:attention]

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
          `A) Static attention means GAT reuses the same attention weight matrix across all stacked layers of the network; GATv2 instead learns a fresh, independent weight matrix per single layer`,
          `B) Original GAT's e_{ij} decomposes into f(i)+g(j), so ranking is fixed across all sources; GATv2 concatenates before the nonlinearity, enabling per-source dynamic neighbor rankings`,
          `C) Static attention means the weights are frozen at random initialization and never updated during backpropagation; GATv2 instead applies gradient-based online updates each step`,
          `D) The static attention problem is that original GAT entirely ignores edge features during scoring; GATv2's fix is adding a learned edge-feature term into the same static formula`,
        ],
        answer: `B`,
      },
      {
        q: `You are building a fraud detection GNN. The graph has legitimate users with many connections (hubs) and fraudsters with few connections. Why might mean aggregation fail, and how would GAT help?`,
        options: [
          `A) Mean aggregation fails purely because fraudsters have fewer connections, which makes any embedding statistically noisier; GAT fixes this by up-weighting all low-degree nodes uniformly`,
          `B) Mean dilutes the fraud signal across hundreds of legitimate neighbors; GAT can learn high attention on the few suspicious ones and add edge features to make it transaction-aware`,
          `C) Mean aggregation only fails for fraud detection when the graph is heterophilic overall; if fraudsters connect mainly to other fraudsters, plain mean aggregation works just as well`,
          `D) GAT helps fraud detection mainly because its 8 attention heads each independently memorize a distinct labeled fraud ring from the training set and vote at inference`,
        ],
        answer: `B`,
      },
      {
        q: `Which two of the following statements about softmax normalization in GAT on high-degree hub nodes are TRUE? (Select two.)`,
        options: [
          `A) For a 10,000-neighbor hub, softmax's large denominator dilutes the top neighbor's weight toward uniform, making aggregation behave like a plain average`,
          `B) Practical mitigations include top-K attention, sigmoid attention with no normalization, or presampling neighbors before applying the attention mechanism`,
          `C) High-degree nodes dominate training purely because they receive proportionally more gradient updates per epoch than low-degree nodes in the batch`,
          `D) Softmax normalization is not problematic for high-degree nodes — attention weights naturally stay concentrated regardless of neighborhood size`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `GATv2 fixes a subtle but consequential flaw in the original GAT: original GAT attention is static — the ranking of neighbors is the same for every source node because the nonlinearity is applied to linearly separable source and target terms. GATv2 applies the nonlinearity after concatenating source and target features, making attention dynamic — different source nodes produce different neighbor rankings. This matters whenever the relevance of a neighbor depends on the identity of the querying node, which is the common case in heterophilic graphs, heterogeneous graphs, and any setting where relationships are asymmetric.`,
    recap: [
      `**GAT replaces degree-normalized weights with learned attention:** $\\alpha_{ij} = \\mathrm{softmax}(\\mathrm{LeakyReLU}(a^T[Wh_i \\| Wh_j]))$.`,
      `**Original GAT attention is static:** nonlinearity applied to independent source+target terms → same neighbor ranking for every source node.`,
      `**GATv2 fix:** nonlinearity after concatenation → joint $(i,j)$ representation → dynamic attention, strictly more expressive.`,
      `**Multi-head:** K independent heads (typ. 8), concat in hidden layers, average at output — each head learns a different relation aspect.`,
      `**Attention wins on:** heterophilic graphs, noisy edges/bots, highly variable degree.`,
      `**GAT ≠ always better:** on uniform-weight graphs attention → near-uniform, no payoff. Inspect $\\alpha_{ij}$ before claiming it helps.`,
      `**Attention collapse in deep GAT:** weights concentrate on hubs → dropout on $\\alpha_{ij}$ regularizes it.`,
    ],
    figures: {
      attention: `<svg viewBox="0 0 360 108" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="8">GAT learns per-edge weights &#945;&#8339; instead of uniform degree-norm</text>
  <line x1="167" y1="56" x2="62" y2="34" stroke="var(--prime)" stroke-width="4.5"/>
  <line x1="167" y1="62" x2="62" y2="88" stroke="var(--rim)" stroke-width="1"/>
  <line x1="193" y1="56" x2="300" y2="34" stroke="var(--prime)" stroke-width="3"/>
  <line x1="193" y1="64" x2="300" y2="90" stroke="var(--rim)" stroke-width="1"/>
  <circle cx="180" cy="60" r="13" fill="var(--prime)"/><text x="180" y="64" text-anchor="middle" fill="var(--ink-hi)" font-size="9">i</text>
  <circle cx="50" cy="32" r="11" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="50" y="35" text-anchor="middle" fill="var(--ink-hi)" font-size="7">Nature</text>
  <text x="108" y="30" fill="#22c55e" font-size="8" font-weight="700">&#945;=0.55</text>
  <circle cx="50" cy="90" r="11" fill="var(--depth)" stroke="var(--rim)"/><text x="50" y="93" text-anchor="middle" fill="var(--ink-low)" font-size="6">predatory</text>
  <text x="102" y="92" fill="#ef4444" font-size="8">&#945;=0.02</text>
  <circle cx="312" cy="32" r="11" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="312" y="35" text-anchor="middle" fill="var(--ink-hi)" font-size="7">cited</text>
  <text x="228" y="30" fill="var(--prime)" font-size="8">&#945;=0.30</text>
  <text x="240" y="92" fill="var(--ink-low)" font-size="8">&#945;=0.13</text>
  <text x="8" y="104" fill="var(--ink-low)" font-size="7">&#945;&#8339;&#11388; = softmax(LeakyReLU(a&#7488;[Wh&#7522; &#8214; Wh&#11388;])) &#8212; near-uniform &#8594; attention isn't helping</text>
</svg>`,
    },
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
        q: `Which two of the following statements about mean-aggregation GCN vs 1-WL expressiveness are TRUE? (Select two.)`,
        options: [
          `A) Mean aggregation is not injective over multisets — neighbors {1,2,3} and {1,1,4} both average to 2, so GCN cannot distinguish those two neighborhoods`,
          `B) 1-WL hashes the full neighbor multiset rather than averaging it, so it distinguishes {1,2,3} from {1,1,4}; sum-based GIN is strictly more expressive than mean-based GCN`,
          `C) GCN is strictly more expressive than 1-WL because it operates on continuous real-valued features rather than the discrete integer colors that 1-WL assigns to nodes`,
          `D) GCN fails to distinguish neighborhood structures only in the degenerate case where every node in the graph shares an identical initial feature vector`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `What is over-squashing in GNNs, and how would you diagnose and fix it in a production model?`,
        options: [
          `A) Over-squashing is when too many raw input features get compressed into a small embedding dimension; the fix is simply increasing the hidden layer size until the bottleneck disappears`,
          `B) Distant-node info is squeezed through narrow topological bottlenecks, causing the Jacobian to decay exponentially; diagnose via sensitivity, fix with rewiring or virtual nodes`,
          `C) Over-squashing is identical to over-smoothing in every respect — both phenomena are caused exclusively by stacking too many GNN layers on any graph topology`,
          `D) Over-squashing only affects graph-level classification tasks; for node classification, narrow topological bottlenecks have essentially no measurable effect on prediction quality`,
        ],
        answer: `B`,
      },
      {
        q: `GIN achieves maximal 1-WL expressiveness. Why does it still fail to distinguish some pairs of non-isomorphic graphs, and what class of graphs is this?`,
        options: [
          `A) GIN fails because sum aggregation is numerically less stable than mean aggregation on graphs containing several very high-degree hub nodes near the batch boundary`,
          `B) GIN is 1-WL equivalent — it fails on k-regular graphs and chemical pairs like Decalin vs bicyclo[2.2.2]octane; fixes need higher-order GNNs or structural features`,
          `C) GIN fails on any graph whose node features are not strictly one-hot encoded, since continuous-valued features fall entirely outside the formal 1-WL color-refinement framework`,
          `D) GIN fails specifically on graphs larger than roughly 10,000 nodes, because the unbounded sum aggregation eventually overflows standard 32-bit floating point precision`,
        ],
        answer: `B`,
      },
      {
        q: `Explain why graph Transformers are more expressive than MPNNs and what practical tradeoff this introduces at scale.`,
        options: [
          `A) Graph Transformers are more expressive simply because they use multi-head attention internally, a mechanism that message-passing GNNs are architecturally incapable of implementing`,
          `B) Attention runs between all node pairs regardless of edges, exceeding 1-WL; the cost is O(|V|\xb2), addressed via sparse attention, GPS, or small-molecule restriction`,
          `C) Graph Transformers are more expressive mainly because they process every node's update fully in parallel rather than propagating messages sequentially hop by hop`,
          `D) The expressiveness gain of graph Transformers is purely theoretical bookkeeping — in empirical benchmarks they perform statistically identically to GIN across every dataset`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Every MPNN is bounded by the 1-Weisfeiler-Leman test, and mean-aggregation GNNs (GCN, GraphSAGE) are strictly below that ceiling — mean cannot distinguish multisets with the same average, so nodes with neighborhoods {1,2,3} and {1,1,4} are indistinguishable. GIN with sum aggregation reaches the 1-WL ceiling. This expressiveness limit is consequential for molecular chemistry and combinatorial tasks where substructure counts matter, but for node classification and link prediction on real-world graphs, the empirical performance gap between GCN and GIN usually closes. The key is knowing which regime you're operating in.`,
    recap: [
      `**MPNN = 3 phases/layer:** message $M_t(h_v,h_w,e_{vw})$ → aggregate (permutation-invariant) → update $U_t$. GCN/GAT/GraphSAGE are all instances.`,
      `**1-WL test is the hard ceiling:** no MPNN can distinguish graphs 1-WL can't. Formal upper bound on expressiveness.`,
      `**GIN reaches 1-WL iff aggregation is injective:** sum is injective, mean is not ({1,2,3} and {1,1,4} share mean 2).`,
      `**1-WL fails on regular graphs and cycles** — two triangles vs a 6-cycle look identical; matters for molecular ring structure.`,
      `**Beyond 1-WL:** k-WL/k-GNN, graph Transformers (all-pairs attention, O(|V|²)), or precomputed structural features (degree, triangle count).`,
      `**K = 3–6 rounds** matches relevant locality; more rounds → over-smoothing, node identities lost.`,
      `**Over-squashing:** distant info compressed through topological bottlenecks → vanishing gradients; fix with rewiring/virtual nodes.`,
    ],
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

[FIGURE:leakage]

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
          `A) Always use a GNN — structural heuristics like Adamic-Adar are only suitable for academic paper benchmarks, never for real production recommendation systems`,
          `B) Use Adamic-Adar when homophilic and low latency matters — 80-90% of GNN AUC at O(|E|) cost; use a GNN when features or inductivity justify it`,
          `C) Use Adamic-Adar exclusively for cold-start users and a GNN for every other user — this activity-level split is the fixed standard industry rule regardless of network density`,
          `D) GNNs always outperform Adamic-Adar on any social network by a wide margin; heuristics are only ever competitive on sparse academic citation networks`,
        ],
        answer: `B`,
      },
      {
        q: `Explain why TransE fails for symmetric relations in knowledge graphs and what model you would use instead.`,
        options: [
          `A) TransE fails for symmetric relations mainly because it scores triples with L2 distance instead of cosine similarity, which cannot represent bidirectional relations`,
          `B) TransE needs h+r=t; symmetric r(a,b) and r(b,a) forces r=0, collapsing entities; RotatE models r as a complex rotation, avoiding that collapse`,
          `C) TransE fails on symmetric relations only when the embedding dimension is set too small; simply increasing d to 512 or higher fully resolves the collapse issue`,
          `D) TransE handles symmetric relations fine with a symmetric weight initialization scheme; the collapse failure only ever appears under fully random initialization`,
        ],
        answer: `B`,
      },
      {
        q: `Which two of the following statements about data leakage in link prediction are TRUE? (Select two.)`,
        options: [
          `A) If test edge (A,B) has training edges (A,C) and (C,B), the GNN encodes C in both A's and B's embeddings, inflating z_A·z_B without real generalization`,
          `B) The correct fix is to remove all test and validation edges from the training adjacency matrix, and for temporal graphs always split strictly by time`,
          `C) Data leakage in link prediction is a concern unique to knowledge graphs; for citation networks, purely random edge splits are always statistically valid`,
          `D) The correct split removes test nodes rather than test edges from training — edges between two training nodes are always safe to keep regardless of test status`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `Evaluation methodology is the most dangerous part of link prediction. Naive random edge splits allow the GNN to learn paths through test edges during training, inflating apparent accuracy without any genuine generalization. The correct procedure removes test edges from the training adjacency matrix entirely — the GNN must never see paths through edges it will be tested on. For temporal graphs, a time-based split is mandatory: a model trained with future knowledge and evaluated on past links is measuring recall of a known graph, not prediction of an unknown one.`,
    recap: [
      `**Link prediction = infer missing triples:** KGs (Freebase 40M entities, 100M triples) are incomplete snapshots.`,
      `**Heuristics are strong baselines:** Common Neighbors, Adamic-Adar, Katz run O(|E|), no training, often beat GNNs on homophilic graphs.`,
      `**If the GNN doesn't beat Adamic-Adar, it's learning nothing** the structure doesn't already say.`,
      `**Decoders:** dot product (symmetric, linear) → bilinear $z_u^T R z_v$ (asymmetric) → KG models TransE/RotatE/ComplEx.`,
      `**Negative sampling matters:** k=5–20/positive; random = trivial, hard negatives = rich gradient but risk false negatives.`,
      `**Data leakage is the trap:** if test edge $(u,v)$ has training path $u$-$w$-$v$, dot product is inflated by shared $w$ — remove test edges from the training adjacency.`,
      `**SEAL** trains on the local enclosing subgraph (structural labels) → avoids leakage, captures link structure directly.`,
    ],
    figures: {
      leakage: `<svg viewBox="0 0 360 104" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="8">Leakage: test edge A&#8211;B with training path A&#8211;C&#8211;B inflates z&#8320;&#183;z&#8331;</text>
  <line x1="70" y1="46" x2="132" y2="66" stroke="var(--prime)" stroke-width="1.5"/>
  <line x1="70" y1="86" x2="132" y2="66" stroke="var(--prime)" stroke-width="1.5"/>
  <line x1="70" y1="46" x2="70" y2="86" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 3"/>
  <circle cx="70" cy="46" r="11" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="70" y="49" text-anchor="middle" fill="var(--ink-hi)" font-size="8">A</text>
  <circle cx="70" cy="86" r="11" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="70" y="89" text-anchor="middle" fill="var(--ink-hi)" font-size="8">B</text>
  <circle cx="132" cy="66" r="11" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="132" y="69" text-anchor="middle" fill="var(--ink-hi)" font-size="8">C</text>
  <text x="34" y="70" fill="#ef4444" font-size="7">test</text>
  <text x="196" y="38" fill="#ef4444" font-size="8" font-weight="700">&#10007; naive split</text>
  <text x="196" y="54" fill="var(--ink-mid)" font-size="7">C sits in both z&#8320; and z&#8331;</text>
  <text x="196" y="68" fill="var(--ink-mid)" font-size="7">&#8594; high score from shared C,</text>
  <text x="196" y="82" fill="var(--ink-mid)" font-size="7">not generalization</text>
  <text x="196" y="98" fill="#22c55e" font-size="7">Fix: drop test/val edges from train adj</text>
</svg>`,
    },
  },
  {
    id: 'node_classification_at_scale',
    interactiveId: 'neighbor_explosion_viz',
    title: 'Scalable GNNs for Node Classification',
    subtitle: 'Neighbor explosion, Cluster-GCN, GraphSAINT, SIGN, cold-start, class imbalance',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['scalable GNN', 'Cluster-GCN', 'GraphSAINT', 'SIGN', 'cold-start', 'mini-batch', 'imbalance'],
    interactivePrompt: `Before you touch the controls: a 2-layer GNN on a node with average degree 100 needs 100 first-hop neighbors and up to 10,000 second-hop neighbors. A 3-layer GNN needs up to 1 million. For a graph with 100 million nodes, full-batch training is impossible. What are your options for training in mini-batches — and what does each approach trade away?`,
    summary: `A 2-layer GNN on a node with average degree 100 requires 100 first-hop and up to 10,000 second-hop neighbors. A 3-layer GNN requires up to 1 million. For a graph with 100 million nodes, full-batch training is not a slow option — it is not an option at all. This is the neighbor explosion problem, and it appears immediately when scaling beyond academic benchmarks.

[FIGURE:scaling]

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
          `A) The 5% gap is expected and fine — always evaluate on the training clusters themselves; full-graph evaluation is not a meaningful metric for cluster-based training runs`,
          `B) Distribution shift: Cluster-GCN ignores cross-cluster edges, so full-graph inference sees a shifted input; fix with multi-cluster batching or GraphSAINT`,
          `C) The gap indicates overfitting to the training clusters specifically; the standard fix is reducing model depth from 2 layers down to a single layer`,
          `D) The gap is entirely caused by METIS producing unbalanced partition sizes; switching to uniform random partitioning resolves the accuracy gap`,
        ],
        answer: `B`,
      },
      {
        q: `Design the architecture for GNN-based fraud detection at a payments company with 100M users, 1B transactions per day, and 0.1% fraud rate. Focus on scalability and handling cold-start.`,
        options: [
          `A) Use full-batch GCN directly on the daily transaction graph; 100M nodes fits comfortably on a modern multi-GPU cluster; apply SMOTE oversampling for the class imbalance`,
          `B) Bipartite graph with SIGN/GraphSAGE hybrid embeddings, focal loss at 1000x fraud weight, MLP-only cold-start fallback, GAT for analyst interpretability`,
          `C) Train one separate GNN per merchant category specifically to sidestep class imbalance, then ensemble their independent outputs together at serving time`,
          `D) Skip the GNN entirely and use a simple MLP on aggregated user-level features — transaction graphs change far too fast for any graph-based fraud model`,
        ],
        answer: `B`,
      },
      {
        q: `Which two of the following statements about GraphSAINT vs Cluster-GCN on the Reddit graph (230K nodes, 11M edges, highly connected) are TRUE? (Select two.)`,
        options: [
          `A) GraphSAINT with random walk sampling suits Reddit better because METIS would cut through many informative cross-community edges given the weak community structure`,
          `B) GraphSAINT achieves roughly 93.0% accuracy on this benchmark versus Cluster-GCN's roughly 90.4%, reflecting the cost of Cluster-GCN's dropped cross-cluster edges`,
          `C) Cluster-GCN is the better choice mainly because METIS partitioning is deterministic and therefore strictly more reproducible than GraphSAINT's stochastic sampling`,
          `D) Both methods perform statistically identically on highly connected graphs like Reddit, so the choice should rest solely on implementation complexity, not accuracy`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `The neighbor explosion problem — a K-layer GNN's required neighborhood grows exponentially with K — makes full-batch training impossible at scale and forces a choice between partitioning (Cluster-GCN), subgraph sampling (GraphSAINT), and offline precomputation (SIGN). The choice depends on graph structure and whether embeddings need to be dynamic. The often-overlooked issue is training-time distribution shift: a GNN trained on dense clusters performs 5% worse on the full graph because the cross-cluster edges it never saw during training shift the input distribution at inference time. Always evaluate with full-graph inference even when training uses mini-batches.`,
    recap: [
      `**Neighbor explosion kills full-batch:** K=3, deg-100, B=512 → up to 512M lookups/step. Impossible at graph scale.`,
      `**Cluster-GCN:** METIS-partition into dense clusters, train within cluster. No explosion; error = ignored cross-cluster edges.`,
      `**GraphSAINT:** sample node/edge/random-walk subgraphs, normalize by sampling prob for unbiased gradients. Better on globally connected graphs.`,
      `**SIGN:** precompute multi-hop diffusion features $(\\tilde{D}^{-1/2}\\tilde{A}\\tilde{D}^{-1/2})^k X$ offline → MLP. As fast as tabular; can't adapt to new edges.`,
      `**Choice depends on structure:** dense communities → Cluster-GCN; globally connected → GraphSAINT (Reddit 93% vs 90.4%).`,
      `**Distribution shift symptom:** ~5% gap between subgraph-train accuracy and full-graph inference — always eval on full-graph inference.`,
      `**Class imbalance often beats architecture:** fraud 0.1% positive → focal loss, BalancedSampler; add degree/clustering as features.`,
    ],
    figures: {
      scaling: `<svg viewBox="0 0 360 112" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="8">Neighbor explosion (K=3, deg 100 &#8594; up to 1M) &#8594; three mini-batch strategies</text>
  <rect x="6" y="22" width="112" height="80" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="62" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">Cluster-GCN</text>
  <text x="62" y="54" text-anchor="middle" fill="var(--ink-mid)" font-size="7">METIS dense clusters,</text>
  <text x="62" y="66" text-anchor="middle" fill="var(--ink-mid)" font-size="7">train within cluster</text>
  <text x="62" y="86" text-anchor="middle" fill="var(--amber)" font-size="7">drops cross-cluster</text>
  <text x="62" y="97" text-anchor="middle" fill="var(--ink-low)" font-size="7">best: dense communities</text>
  <rect x="124" y="22" width="112" height="80" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="180" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">GraphSAINT</text>
  <text x="180" y="54" text-anchor="middle" fill="var(--ink-mid)" font-size="7">sample subgraphs,</text>
  <text x="180" y="66" text-anchor="middle" fill="var(--ink-mid)" font-size="7">norm by samp. prob</text>
  <text x="180" y="86" text-anchor="middle" fill="#22c55e" font-size="7">unbiased gradients</text>
  <text x="180" y="97" text-anchor="middle" fill="var(--ink-low)" font-size="7">best: globally connected</text>
  <rect x="242" y="22" width="112" height="80" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="298" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">SIGN</text>
  <text x="298" y="54" text-anchor="middle" fill="var(--ink-mid)" font-size="7">precompute k-hop</text>
  <text x="298" y="66" text-anchor="middle" fill="var(--ink-mid)" font-size="7">features &#8594; MLP</text>
  <text x="298" y="86" text-anchor="middle" fill="#22c55e" font-size="7">fast as tabular</text>
  <text x="298" y="97" text-anchor="middle" fill="var(--amber)" font-size="7">can't adapt to new edges</text>
</svg>`,
    },
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

[FIGURE:hetero]

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
        q: `Which two of the following statements about RGCN vs HGT on a 10-node-type, 25-edge-type e-commerce graph are TRUE? (Select two.)`,
        options: [
          `A) 25 full W_r matrices give roughly 1.6M parameters at d=256, causing overparameterization and insufficient gradient signal for rare relation types`,
          `B) HGT uses node-type-specific projections plus small relation-specific attention modifiers, cutting parameter growth from O(|R|d\xb2) toward O(|A|d\xb2)+O(|R|d)`,
          `C) 25 weight matrices are entirely manageable and the only real problem is training wall-clock time, which HGT solves purely by parallelizing edge types across GPUs`,
          `D) RGCN with 25 full relation matrices is strictly more expressive than HGT and should always be preferred whenever sufficient training data exists for every type`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Meta-paths in HAN are defined manually. What is wrong with this, and how would you make meta-path selection data-driven?`,
        options: [
          `A) Manually defined meta-paths are always fully correct because domain experts understand the graph's semantics far better than any automated discovery method could`,
          `B) Manual meta-paths need expertise that doesn't generalize as the graph evolves and can miss non-obvious paths; HGT or sparsity-regularized discovery make this data-driven`,
          `C) The only real problem with manual meta-paths is raw computational efficiency — automated discovery always converges to the exact same paths a domain expert would pick, just faster`,
          `D) Manual meta-paths are a problem only for temporal, time-evolving graphs; for static heterogeneous graphs, manual definition remains the objectively correct approach`,
        ],
        answer: `B`,
      },
      {
        q: `In a knowledge graph with 1M entities and 500 relation types, how would you handle the scalability and rare-relation problems simultaneously?`,
        options: [
          `A) Filter out and discard every relation type with fewer than 10,000 training edges before training even begins — rare relations are assumed too noisy to model reliably`,
          `B) Use RGCN basis decomposition (B=40 shared bases, ~12x fewer params); relation-stratified mini-batch sampling; cluster similar relations to share parameters`,
          `C) Train one fully separate GNN model per individual relation type — this sidesteps both the scalability and rare-relation problems purely through specialization`,
          `D) Replace the GNN entirely with a plain TransE embedding model, since pure embedding methods are assumed to scale better with relation-type count than any GNN`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Heterogeneous graphs are the production default, not the exception. The key architecture decision is RGCN (relation-specific full weight matrices, O(|R|\xd7d\xb2) parameter growth) vs HGT (relation-specific attention with shared weights, linear parameter growth). With 25+ relation types and d=256, RGCN's parameter count becomes infeasible for rare relation types that have insufficient training signal; HGT's shared weights with type-specific modifiers handle this gracefully. Basis decomposition is non-optional for RGCN at scale — reducing O(|R|\xd7d\xb2) to O(B\xd7d\xb2) + O(|R|\xd7B) provides ~12\xd7 parameter reduction at d=256 with B=40.`,
    recap: [
      `**Heterogeneous graphs are the production default:** click vs purchase edges carry different semantics — homogenizing discards the commercial signal.`,
      `**RGCN = one $W_r$ per relation:** O(|R|\xd7d\xb2) params. 200 types, d=256 → 13M params; rare relations (<1K edges) can't learn a full matrix.`,
      `**Basis decomposition is non-optional for RGCN at scale:** $W_r = \\sum_b a_{r,b}V_b$ → ~12\xd7 fewer params at d=256, B=40.`,
      `**Meta-paths** (APA, APVPA) define semantic routes but need manual expert definition — a bottleneck.`,
      `**HAN:** two-level attention (node-level within meta-path + semantic-level across meta-paths); still needs manual meta-paths.`,
      `**HGT is the recommended default:** relation-specific attention, shared weights + small modifiers → O(|A|\xd7d\xb2)+O(|R|\xd7d), no meta-paths.`,
      `**Homogenize deliberately** when types are numerous+rare or encodable as edge features — not by default.`,
    ],
    figures: {
      hetero: `<svg viewBox="0 0 360 106" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="8">Typed nodes + typed edges: a "purchase" is not a "view"</text>
  <line x1="60" y1="48" x2="180" y2="40" stroke="#22c55e" stroke-width="3"/>
  <line x1="60" y1="56" x2="180" y2="76" stroke="var(--ink-low)" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="204" y1="40" x2="300" y2="34" stroke="var(--prime)" stroke-width="1.5"/>
  <line x1="204" y1="76" x2="300" y2="82" stroke="var(--prime)" stroke-width="1.5"/>
  <circle cx="46" cy="52" r="13" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="46" y="55" text-anchor="middle" fill="var(--ink-hi)" font-size="7">User</text>
  <rect x="180" y="28" width="26" height="24" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="193" y="43" text-anchor="middle" fill="var(--ink-hi)" font-size="7">Item</text>
  <rect x="180" y="64" width="26" height="24" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="193" y="79" text-anchor="middle" fill="var(--ink-hi)" font-size="7">Item</text>
  <polygon points="314,26 326,42 302,42" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="314" y="55" text-anchor="middle" fill="var(--ink-mid)" font-size="6">Category</text>
  <polygon points="314,74 326,90 302,90" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="314" y="102" text-anchor="middle" fill="var(--ink-mid)" font-size="6">Brand</text>
  <text x="96" y="34" fill="#22c55e" font-size="7" font-weight="700">purchase</text>
  <text x="96" y="82" fill="var(--ink-low)" font-size="7">view</text>
  <text x="8" y="102" fill="var(--ink-low)" font-size="7">Homogenize &#8594; purchase &#8801; view; RGCN: W&#7869; per relation; HGT: shared W + modifiers</text>
</svg>`,
    },
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

Moving a GNN from an academic benchmark to production exposes problems that benchmark papers omit: graphs with billions of edges, millisecond latency requirements, continuous updates that invalidate cached embeddings, and predictions that must be explainable to analysts. PinSage (Ying et al., 2018) is the canonical case study — from a 2-layer GraphSAGE prototype to a system serving hundreds of millions of users. Its most important innovations are not architectural: random walk importance sampling, MapReduce offline embedding computation, and ANN serving are the engineering decisions that made billion-scale GNN deployment feasible.

**NOT this.** "GNNs are only used for node classification." GNNs support node classification (protein function prediction), link prediction (friend recommendation, drug-target interaction), graph classification (molecule property, circuit quality), and graph generation (drug design). The readout function changes — per-node output for node classification, pair scoring for link prediction, global pooling for graph classification — but the message-passing backbone is the same. The drug-target binding task above is a graph-graph matching problem that uses GNN encoders on both graphs plus cross-attention for compatibility scoring.`,
    keyPoints: [
      `**PinSage (Pinterest, 2018): 3B pins, 18B edges on a pin-board bipartite graph.** Full-batch GCN impossible — infeasible at any node count near 3B. Solution: random walk-based neighborhood sampling — define each pin's neighborhood via L1-normalized random-walk visit counts (importance sampling), with production using a neighborhood size of T=50 most-visited pins. This captures second-order proximity and is more robust than uniform sampling because popular boards don't dominate the neighborhood — pins visited via multiple distinct short walks get higher weight than pins reachable through a single high-degree hub.`,
      `**PinSage scalability stack: offline embedding via MapReduce pipeline (GPU machines compute mini-batch embeddings, written to RocksDB); online serving via FAISS ANN on precomputed embeddings (< 10ms for top-1,000 similar pins); curriculum training starting with easy random negatives and progressively using semantically hard negatives from the embedding space.** This infrastructure stack — not the GNN architecture — is what makes 3B-pin scale work. The architecture is 2-layer GraphSAGE.`,
      `**Fraud detection on transaction networks: nodes = users + merchants, edges = transactions with features (amount, time, merchant category, device ID).** Key challenges: temporal causality (training must never use features from future timestamps), adversarial adaptation (fraudsters change patterns after detection), and ring structure as a fraud signal (fraudsters create A→B→C→A cycles). Structural features like betweenness centrality and cycle count often provide stronger signals than node content features alone.`,
      `**Drug discovery: atoms as nodes (atomic number, charge, hybridization), bonds as edges (bond type, aromaticity).** Tasks: molecular property prediction, drug-target binding affinity, reaction yield. Datasets are small (1K–100K molecules). Solution: pretrain on large unlabeled molecular databases (ZINC, ChEMBL) then fine-tune — SSL pretraining provides the 10\xd7 labeled data reduction that makes molecular GNNs practical. Used in AlphaFold's structural inputs and property-prediction pipelines at major pharmaceutical companies.`,
      `**Dynamic graphs in production: most production graphs change continuously — new users sign up, transactions occur every second, friendships form and dissolve.** Three approaches: (1) Snapshot-based — retrain or update a static GNN on graph snapshots at regular intervals; simple but misses inter-snapshot dynamics. (2) TGAT (Temporal Graph Attention): embeddings are functions of node features plus temporal encodings of event timestamps, Transformer-style. (3) TGN (Temporal Graph Network): nodes carry memory states updated by each new interaction, capturing long-term user behavior across batches. TGN is the production standard for real-time recommendation.`,
      `**Real-time GNN inference latency: a 2-layer GNN for a user with 1,000 connections, each with 1,000 connections, requires 1M feature lookups per inference.** Done as sequential single-key lookups at sub-millisecond Redis latency each, that's minutes, not milliseconds — three orders of magnitude too slow for real-time ranking. Production solution: precompute and cache 1-hop aggregations nightly; update cache on new edges via event-driven invalidation. Decouple feature store freshness (updated every minute) from embedding freshness (recomputed every few hours). The two are different concerns with different latency requirements.`,
      `**Feature engineering often beats architecture improvements in practice.** Structural features beyond node content: degree (in and out separately for directed graphs), clustering coefficient, PageRank or personalized PageRank, Node2Vec topology embeddings, temporal features (average edge age, edge creation rate in last 7/30/90 days). These can be precomputed and added as node features, giving the GNN access to higher-order structural information without adding depth — and without the over-smoothing risk that depth adds.`,
      `**Production serving infrastructure pattern: feature store (Redis/RocksDB, sub-millisecond lookup) + graph store (adjacency lists in distributed key-value store) + embedding store (FAISS index for ANN) + batch recompute pipeline (Spark + GPU workers for hourly/daily refresh) + event stream (Kafka for real-time edge additions, triggering embedding refresh for high-priority nodes).** The GNN model is often deployed unchanged for months; embedding quality degrades more from stale graph data than from model staleness.`,
    ],
    checkQuestions: [
      {
        q: `You are the ML lead for friend recommendations at a social network with 500M users. Design a GNN system end-to-end, from data pipeline to serving. What are the top 3 engineering challenges?`,
        options: [
          `A) Use full-batch spectral GCN directly on the daily graph snapshot; the top 3 challenges are GPU memory limits, total training time, and raw label quality`,
          `B) GraphSAGE with SIGN offline batches and FAISS serving; top challenges are embedding staleness, train-serve distribution shift, and feedback loop bias`,
          `C) Start with a matrix factorization baseline and only add GNNs if it underperforms; the top 3 challenges are cold start, raw scalability, and negative sampling strategy`,
          `D) Use TGN for fully real-time updates across all 500M users; the top 3 challenges are memory management, Kafka throughput, and graph partitioning scheme`,
        ],
        answer: `B`,
      },
      {
        q: `PinSage uses random walks to define "neighborhoods" rather than direct graph neighbors. Why? What problem does this solve?`,
        options: [
          `A) Random walks are used mainly because computing direct neighbors requires a full graph traversal, which is inherently slower than precomputed random walk visit statistics`,
          `B) Popular boards would dominate uniform sampling; random-walk visit frequency naturally up-weights niche co-occurrence and down-weights hub boards, bounding neighborhood size`,
          `C) Random walks produce categorically better embeddings simply because they capture long-range dependencies that direct-neighbor aggregation is architecturally incapable of ever seeing`,
          `D) Random walks exist specifically to handle cold-start pins that have zero direct neighbors — pins with existing edges use ordinary uniform sampling instead`,
        ],
        answer: `B`,
      },
      {
        q: `Which two of the following are plausible causes of a fraud GNN scoring 99% offline AUC but only 70% precision at 10% recall in production? (Select two.)`,
        options: [
          `A) Temporal leakage from random transaction splits letting fraud ring members appear in both train and test — fixed by switching to strictly time-based splits`,
          `B) Graph feature leakage where structural features were computed on the full graph including future edges — fixed by building features from time T data only`,
          `C) The gap is caused purely by production serving latency — a 70% precision figure implies the model is timing out and silently falling back to a weaker baseline`,
          `D) 99% offline AUC with weak production precision means the held-out validation set is simply too small — enlarging it to a 20% holdout will close the gap`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `PinSage is the definitive case study for production GNNs at scale: 3B nodes, 18B edges, sub-10ms serving latency. Its innovations — random walk-based neighborhood importance sampling, MapReduce offline embedding computation, and ANN retrieval — collectively solve the three hard production problems: neighborhood explosion, embedding staleness, and low-latency inference. The practical lesson is that a production GNN system is not one model but a pipeline — feature store, graph store, batch embedding computation, ANN index, and event-driven cache invalidation are all load-bearing components, and the GNN model itself is often the least complex part of the system.`,
    recap: [
      `**GNNs beat feature engineering when structure carries the signal** — molecules, proteins, social nets, circuits — learning representations end-to-end.`,
      `**PinSage is the canonical case study:** 3B pins, 18B edges, <10ms serving. Innovations are engineering, not architecture (2-layer GraphSAGE).`,
      `**PinSage stack:** random-walk importance sampling + MapReduce offline embeddings + FAISS ANN serving + curriculum hard negatives.`,
      `**Fraud detection:** temporal causality (no future features), adversarial adaptation, ring structure ($A{\\to}B{\\to}C{\\to}A$) as signal.`,
      `**Drug discovery:** small labeled data → pretrain on ZINC/ChEMBL (SSL) then fine-tune → ~10× labeled-data reduction.`,
      `**Dynamic graphs:** snapshots → TGAT (temporal encodings) → TGN (per-node memory) = production standard for real-time recsys.`,
      `**Production is a pipeline, not a model:** feature store + graph store + embedding store + batch recompute + Kafka event stream; staleness hurts more than model age.`,
    ],
  },
]
