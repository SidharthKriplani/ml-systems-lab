export const DEEP_LEARNING_MODULES = [
  {
    id: 'neural_nets',
    interactiveId: 'backprop_viz',
    title: 'Neural Network Fundamentals',
    subtitle: 'Perceptron, universal approximation, depth vs width, XOR',
    difficulty: 'foundational',
    estimatedMin: 31,
    tags: ['neural networks', 'universal approximation', 'depth', 'perceptron'],
    summary: `Take two on/off inputs, x₁ and x₂, and try to learn **XOR**: output 1 when *exactly one* input is on, and 0 otherwise. Plot the four cases on a grid and try to separate the 1s from the 0s with a single straight line. You cannot — the 1s sit on one diagonal, the 0s on the other. This is not a data problem or a tuning problem; it is a hard limit. A single linear model can only draw *one* straight boundary, and XOR needs the space bent. And here is the thing: *every* problem a neural network solves is, deep down, this same problem — the input cannot be split as-is, so the model has to reshape it first.

[FIGURE: xor]

---

**One hidden layer is the fix.**

Slip a layer of two neurons between the inputs and the output, pass each through a non-linear squash, and suddenly the network can draw curved, bent, folded boundaries. For XOR: one hidden neuron learns to fire on the "exactly one on" cases, the other suppresses the "both on / both off" cases, and the output combines them. The hidden layer has *transformed* the input into a new space where a straight line finally works — and that is what every hidden layer in every network is doing: reshaping the representation until the decision becomes easy.

---

**How wide, how deep?**

The **universal approximation theorem** says something reassuring: a network with a *single* hidden layer, given enough neurons, can approximate *any* continuous function as closely as you like. So why go deep at all? Because "enough neurons" in one layer can be astronomically many — sometimes exponential in the number of inputs — while a *second* layer can represent the same function with far fewer neurons. That is the real case for depth: not "deeper is magically more accurate," but "depth lets you represent complex functions far more *efficiently*, with fewer parameters."

But — and this matters — the theorem only says a good solution *exists* at depth. It says nothing about whether gradient descent will *find* it. A careless 10-layer network can have its early layers starved of gradient (the vanishing-gradient problem) and simply not learn. That is why so much of deep learning — better activations, normalisation, residual connections — exists purely to make depth *trainable*. Depth buys efficiency; the rest of the toolkit buys the ability to actually use it.`,
    interactivePrompt: `Before you touch the controls: if you add a third hidden layer to the XOR network but keep all activation functions as linear, can the extra depth help — and why or why not?`,
    keyPoints: [
      `**When the problem has structure a single boundary cannot capture.** If a scatter plot of your data cannot be separated by a line (or hyperplane in higher dimensions), a single-layer linear model will always fail — not because of tuning, but structurally. Start with one hidden layer of 8–64 neurons. Add depth only when you have verified the model is capacity-limited on training data, not when validation accuracy is poor (that is a regularisation or data problem).`,
      `**The production trap: confusing depth with performance.** The most common mistake is adding layers when training loss has stalled. Before adding depth, verify that early layers are receiving gradient signal: hook into the backward pass and log gradient norms per layer. A ratio of 1000:1 between last-layer and first-layer gradient norms means your depth is wasted — those early layers are not learning. Adding more layers worsens this. Fix the gradient flow (ReLU, residual connections, better initialisation) before increasing depth.`,
      `**The diagnostic: overfit a single training batch.** Before any hyperparameter search, take one mini-batch and train on it alone with no regularisation. A correct model should reach near-zero loss within 100–200 steps. If it does not, the model cannot learn anything — the architecture, loss function, or output activation is wrong. This test rules out implementation bugs before you spend hours tuning a broken model.`,
    ],
    takeaway: `Depth buys representational efficiency, not accuracy for free — every layer must receive gradient signal or it contributes nothing, which is why the entire architecture of modern deep learning is an answer to the question of how to make depth trainable.`,
    checkQuestions: [
      {
        q: `A fully connected layer with 512 inputs and 256 outputs has how many parameters? What is the forward pass computation?`,
        options: [
          `A) Two hidden layers of 64 units each: ~64×64 + 64×64 = 8,192 parameters (omitting input/output). For equal parameter counts with typical image inputs, depth helps for hierarchical features — a deeper network learns edges → textures → parts → objects. Empirical finding: depth matters more than width for visual tasks like image recognition.`,
          `B) Parameters: weight matrix W is 256×512, so 256×512 = 131,072 weights; the model also needs a separate normalisation layer. Total: 131,072 + 512 = 131,584 parameters. Forward pass: given input x (512×1), compute z = Wx (256×1), then add normalisation before activation: a = σ(normalize(z)).`,
          `C) Parameters: weight matrix W is 512×256, so 512×256 = 131,072 weights; bias vector b is 512×1, so 512 biases. Total: 131,072 + 512 = 131,584 parameters. Forward pass: given input x (512×1), compute z = Wx + b (256×1) — the weight matrix must match input dimension, so W is input_dim × output_dim.`,
          `D) Parameters: weight matrix W is 256×512, so 256×512 = 131,072 weights; bias vector b is 256×1, so 256 biases. Total: 131,072 + 256 = 131,328 parameters. Forward pass: given input x (512×1), compute z = Wx + b (256×1) — a matrix-vector multiplication requiring 256×512 = 131,072 multiply-accumulate operations (FLOPs ≈ 2×131,072 for multiply+add). Then apply activation: a = σ(z). For a batch of n samples (X is 512×n), the forward pass is Z = WX + b where b is broadcast across columns, giving 256×n output — a matrix-matrix multiplication of cost O(256×512×n).`,
        ],
        answer: `D`,
      },
      {
        q: `Universal approximation theorem says a neural network can approximate any continuous function. Why doesn't this guarantee good generalisation?`,
        options: [
          `A) Universal approximation applies only to networks with sigmoid activations — networks using ReLU activations have limited expressiveness and cannot approximate all continuous functions. With ReLU, the network can only represent piecewise-linear functions, so the theorem's guarantee doesn't apply to modern deep networks that rely on ReLU.`,
          `B) Universal approximation is an existence theorem: it says a network with sufficient width/depth can represent any continuous function arbitrarily well on a compact set. It does NOT say the network will learn that function from finite data. The gap: (1) we have finite training data n, not the function itself; (2) the optimisation is non-convex — gradient descent may not find the globally optimal approximation; (3) even if the network fits the training function perfectly, with finite data, many functions fit training data equally well (overfitting). The universal approximator could be learning noise rather than the true underlying function. Generalisation requires regularisation, sufficient data, and the right inductive biases — none of which the theorem addresses.`,
          `C) Universal approximation guarantees that the network can represent the function, but gradient descent is guaranteed to find the global optimum only for convex loss surfaces. Since neural network loss is non-convex, gradient descent always converges to a local minimum that may be far from the true function, regardless of network capacity.`,
          `D) Universal approximation only holds in the limit of infinite width — in practice, finite-width networks cannot approximate all continuous functions. The theorem's conditions are never met in real networks, so it provides no guarantee even in theory for the finite-width networks used in practice.`,
        ],
        answer: `B`,
      },
      {
        q: `Two hidden layers with 64 units each vs one hidden layer with 4096 units: same parameter count approximately. Which architecture performs better for image recognition, and why?`,
        options: [
          `A) Two layers of 64 units: ~64×64 + 64×64 = 8,192 (omitting input/output). One layer of 4096: the actual parameter count is input_dim × 4096 >> 8192. For equal parameter counts with typical image inputs (d=3072 for 32×32×3): the 2-layer architecture has far fewer parameters unless carefully balanced. Setting aside exact counts: depth helps for hierarchical features. For image recognition, a deeper network (even with fewer parameters) learns hierarchical representations — edges → textures → parts → objects. A very wide single hidden layer maps all input pixels to 4096 units directly — no hierarchical composition. Empirical finding: depth matters more than width for visual tasks. LeNet, VGG, and ResNets are all deep, not just wide.`,
          `B) The single layer with 4096 units performs better because it has more neurons to directly process input patterns. Wider layers can represent more diverse feature combinations simultaneously, and a single nonlinearity applied across 4096 units is sufficient to learn complex visual patterns without the gradient attenuation that occurs across multiple layers.`,
          `C) The two architectures perform identically because they have the same parameter count and therefore the same representational capacity. The universal approximation theorem guarantees that both can represent the same class of functions — depth vs width is a training stability concern, not an expressiveness concern, for equal parameter budgets.`,
          `D) The single hidden layer of 4096 units performs better for image recognition specifically because pooling-like behaviour emerges naturally in very wide single layers — the large number of units can implicitly learn spatial invariances that depth would provide, with the advantage of simpler gradient flow through fewer layer transitions.`,
        ],
        answer: `A`,
      },
    ],
    figures: {
      xor: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:200px;font-family:var(--font-sans,sans-serif)">
  <line x1="40" y1="160" x2="170" y2="160" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="40" y1="160" x2="40" y2="30" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="30" y="164" text-anchor="end" fill="var(--ink-low)" font-size="9">0</text>
  <text x="150" y="176" text-anchor="middle" fill="var(--ink-low)" font-size="9">x₁</text>
  <text x="30" y="55" text-anchor="end" fill="var(--ink-low)" font-size="9">1</text>
  <!-- class 0 (teal): (0,0) and (1,1) -->
  <circle cx="60" cy="140" r="8" fill="var(--teal)"/><text x="60" y="143" text-anchor="middle" fill="#000" font-size="9" font-weight="700">0</text>
  <circle cx="150" cy="50" r="8" fill="var(--teal)"/><text x="150" y="53" text-anchor="middle" fill="#000" font-size="9" font-weight="700">0</text>
  <!-- class 1 (amber): (0,1) and (1,0) -->
  <circle cx="60" cy="50" r="8" fill="var(--amber)"/><text x="60" y="53" text-anchor="middle" fill="#000" font-size="9" font-weight="700">1</text>
  <circle cx="150" cy="140" r="8" fill="var(--amber)"/><text x="150" y="143" text-anchor="middle" fill="#000" font-size="9" font-weight="700">1</text>
  <!-- a failed dividing line -->
  <line x1="45" y1="95" x2="165" y2="120" stroke="var(--prime)" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="100" y="192" text-anchor="middle" fill="var(--ink-low)" font-size="9">no single line separates them</text>
</svg>`,
    },
  },
  {
    id: 'backprop',
    interactiveId: 'backprop_viz',
    title: 'Backpropagation',
    subtitle: 'Forward pass, chain rule, computational graph, vanishing gradients',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['backpropagation', 'chain rule', 'gradients', 'computational graph'],
    summary: `You have a network with a hundred million weights, and one training example. Running it forward to get a prediction is fast. But now you need to nudge *every one* of those hundred million weights in the right direction to make the prediction better. How? The naive idea — tweak one weight a hair, re-run the whole forward pass, see if the loss went down, put it back, move to the next weight — costs a full forward pass *per weight*. A hundred million forward passes for a single training step. At that price, deep networks would be untrainable, and for decades people were not sure they could be trained at all.

**Backpropagation** is the trick that makes it cheap. The key realisation: the forward pass already computed everything you need to work out *all* the gradients — you just have to reuse those cached values, walking backward through the network. One forward pass, one backward pass, and you have the gradient for every weight at once, no matter how many there are.

---

**Watch it work (a tiny example).**

Take a 2-layer network with input x = 2.0, weights w₁ = 0.5 and w₂ = 0.3, and target y = 1.0. Forward: compute the first hidden value, squash it with a sigmoid to get h₁ = 0.75 (cache it), carry on to the prediction ŷ = 0.556, and the loss comes out to 0.197. Now go backward, layer by layer, multiplying the local slopes together (that is the chain rule): the gradient for w₂ works out to about −0.164, and the gradient for w₁ to about −0.025. Notice something — w₁'s gradient is already **6.6× smaller** than w₂'s, and the only reason is that reaching one layer deeper multiplied it by the sigmoid's slope (about 0.19). One extra layer, one shrink.

---

**Why deep networks stalled: vanishing gradients.**

That shrink is the whole vanishing-gradient story. A sigmoid's slope is *at most* 0.25, and usually less. Multiply that in at every layer and after 10 layers the gradient reaching the first layer is scaled by roughly 0.25¹⁰ — about one in a million; after 20 layers, essentially zero. The early layers get no signal and never learn, so your "20-layer network" quietly behaves like a 2-layer one. The fix is **ReLU**, whose slope is a clean 1 for active neurons, so nothing shrinks. (ReLU's own catch is the *dead neuron* — one whose input is always negative outputs zero forever; Leaky ReLU and GELU keep a trickle of gradient to prevent that.)

The mirror-image failure is **exploding gradients**, common in recurrent networks that multiply the same weights over and over: if that factor is even slightly above 1, the gradient blows up to NaN. The fix is **gradient clipping** — if the gradient's overall size exceeds a cap, scale it back down while keeping its direction. And **residual connections** fix vanishing structurally: add a shortcut (output = layer + input) and the gradient gets a direct path back that skips the shrinking multiplications, which is why ResNets train hundreds of layers deep.

---

**One practical cost: memory.**

Because the backward pass reuses the forward pass's intermediate values, they all have to be *stored* until the backward pass runs — which for a big model is a lot of memory. **Gradient checkpointing** is the standard trade: keep only a few of those intermediates and recompute the rest on the fly during the backward pass, spending about 30% extra compute to slash memory. It is what lets large models train on limited GPUs. (And for the curious: backprop is often called "just the chain rule," but the magic is applying it in *reverse* order — that reverse direction is exactly what makes the whole thing cost one forward pass instead of one-per-parameter.)`,
    interactivePrompt: `Before you touch the controls: if the forward pass computes the loss, why does the backward pass need to store intermediate activations from the forward pass rather than just the final loss value?`,
    keyPoints: [
      `**When your network has more than one layer and you need to update weights end-to-end.** That is always. Backprop is the only practical algorithm for computing exact gradients in deep networks. You do not implement it yourself — every modern framework (PyTorch, JAX, TensorFlow) runs it automatically. What you do need to understand: the forward pass must cache intermediate activations, gradient checkpointing trades 30% extra compute for O(√depth) memory (mandatory for large models on limited GPU), and the gradient accumulates by summation when multiple paths lead to the same node.`,
      `**The production trap: ignoring gradient norms.** Backprop produces the correct gradient mathematically, but "correct" can be a gradient of 10⁻¹² — numerically zero. Early layers in deep sigmoid networks receive no learning signal, and training proceeds as if those layers do not exist. Always log gradient norms per layer during the first training run. A ratio of 1000:1 between last-layer and first-layer norms means the depth is wasted. The fix is ReLU activations or residual connections, not more data or a different learning rate.`,
      `**The diagnostic: verify gradient flow before anything else.** Register a backward hook on each layer and log the mean absolute gradient at each step. For a 10-layer network with healthy gradient flow, the norms should decay by at most ~10× from output to input — not 10⁶×. If you see exponential decay, the activation function is saturating. If you see exponential growth, gradient clipping (max_norm=1.0) is missing. Both symptoms are visible before the first epoch completes.`,
    ],
    takeaway: `Backprop computes every parameter gradient in roughly one forward pass by caching intermediates and applying the chain rule in reverse — without caching, each gradient would cost a separate forward pass, making large-scale training impossible.`,
    checkQuestions: [
      {
        q: `Derive the gradient of the loss with respect to the bias in a single hidden layer: L = (σ(wx + b) - y)². Compute ∂L/∂b step by step.`,
        options: [
          `A) ∂L/∂b = 2(h - y) · σ'(a) · w, because b and w both appear in a = wx + b, so ∂a/∂b = w (the same coefficient as ∂a/∂w). The bias gradient always equals the weight gradient scaled by x, making ∂L/∂b = 2(h - y) · h(1 - h) · w.`,
          `B) ∂L/∂b = 2(h - y) directly, because the bias term b adds a constant to the pre-activation a = wx + b, and the derivative of a constant with respect to itself is 1. The sigmoid derivative cancels out because the bias is downstream of the activation rather than upstream.`,
          `C) Let a = wx + b (pre-activation), h = σ(a) (activation), L = (h - y)². Chain rule: ∂L/∂b = ∂L/∂h · ∂h/∂a · ∂a/∂b. ∂L/∂h = 2(h - y). ∂h/∂a = σ'(a) = σ(a)(1 - σ(a)) for sigmoid. ∂a/∂b = 1 (since a = wx + b, ∂a/∂b = 1). So ∂L/∂b = 2(h - y) · σ(a)(1 - σ(a)) · 1 = 2(h - y) · h(1 - h). This is the backpropagated error δ multiplied by the local Jacobian of the activation, then multiplied by 1 (the Jacobian of the linear transformation with respect to b). Note: with MSE loss, the factor of 2 is often absorbed into the learning rate; with cross-entropy loss, the form changes but the chain rule structure is the same.`,
          `D) ∂L/∂b = 2(h - y) · h(1 - h) · x, because a = wx + b means ∂a/∂b = x (the same local Jacobian as ∂a/∂w = x). The bias is multiplied by 1 in the linear equation but its gradient accumulates across the batch by summing over the x values.`,
        ],
        answer: `C`,
      },
      {
        q: `What is the vanishing gradient problem in a 10-layer network with sigmoid activations? How does it affect early vs late layers?`,
        options: [
          `A) Sigmoid derivative: σ'(z) = σ(z)(1-σ(z)) ≤ 0.25. Backpropagation multiplies gradients across layers: ∂L/∂W₁ = (∂L/∂a₁₀)·(∂a₁₀/∂a₉)·...·(∂a₂/∂a₁)·(∂a₁/∂W₁). Each layer contributes a factor ≤ 0.25, so the product across 9 layers is ≤ 0.25⁹ ≈ 3.8×10⁻⁶. Layer 10 (last): receives gradient ≈ ∂L/∂a₁₀ — full magnitude, trains well. Layer 1 (first): receives gradient multiplied by ≤3.8×10⁻⁶ of the original — essentially zero. The first layers receive no useful gradient signal; their weights barely update. Network effectively trains only the last few layers, losing the benefit of depth. Solutions: ReLU activations (gradient 1 or 0, no compression), batch normalization (keeps activations in non-saturated range), residual connections (bypass vanishing paths).`,
          `B) The vanishing gradient problem occurs when the learning rate is too high — sigmoid outputs become saturated (near 0 or 1), and a saturated output means the network has converged that layer. Early layers saturate first because they receive higher-magnitude gradient updates, while late layers remain unsaturated and continue training.`,
          `C) Sigmoid compresses gradients by a factor of at most 4 per layer (since max sigmoid derivative is 0.25, the reciprocal is 4, meaning gradients are amplified going backward). This causes the early layers to receive larger gradients than late layers — the opposite of the typical characterisation — which is why early layer weights update more aggressively and tend to overfit first.`,
          `D) The vanishing gradient problem only affects networks where sigmoid is used in conjunction with weight initialisation that produces very small weights. The sigmoid derivative of 0.25 is only problematic when multiplied by small weight values — with proper initialisation (weights scaled to produce unit variance), 10-layer sigmoid networks train without vanishing gradients.`,
        ],
        answer: `A`,
      },
      {
        q: `You compute gradient ∂L/∂W at batch size 32 vs batch size 1. How do the gradient magnitudes compare, and does this affect parameter updates?`,
        options: [
          `A) Batch size 32 produces gradients that are 32× larger than batch size 1, because the batch gradient is the SUM (not average) of individual gradients. With batch size 32, each parameter update is 32× larger in magnitude, requiring the learning rate to be divided by 32 to maintain equivalent training dynamics.`,
          `B) Batch size 32 produces gradients with 32× lower variance because more samples are averaged, making the estimate more stable. The magnitude is also 32× larger because batch gradients sum individual losses — this is why large-batch training requires 32× smaller learning rates to match small-batch convergence behavior.`,
          `C) Batch size 32 produces near-zero gradients for many parameters because averaging 32 samples causes opposing gradient directions to cancel. Batch size 1 gives noisy but higher-magnitude gradients. This is why very large batches converge to sharper minima — the gradient cancellation prevents exploration of the loss landscape.`,
          `D) Both compute the average loss gradient over the batch: for B=32, ∂L/∂W = (1/32)Σᵢ₌₁³² ∂Lᵢ/∂W; for B=1, ∂L/∂W = ∂L₁/∂W. The gradient magnitudes are expected to be approximately the same (both estimate E[∂L/∂W]), but B=32 has lower variance. The parameter update δW = −α × ∂L/∂W is the same order of magnitude for both batch sizes. What changes: B=32 makes fewer updates per epoch (n/32 vs n/1 steps), but each update has lower variance. B=1 has noisier updates but explores more per epoch. The key implication for hyperparameters: if you change from B=32 to B=256 (8x larger batch), you should scale learning rate by 8 (linear scaling rule) to keep the effective update magnitude consistent across batches.`,
        ],
        answer: `D`,
      },
    ],
    interactiveId: 'backprop_viz',
  },
  {
    id: 'activations',
    interactiveId: 'activation_functions',
    title: 'Activation Functions',
    subtitle: 'Sigmoid, tanh, ReLU, Leaky ReLU, GELU, Swish — saturation and dying neurons',
    difficulty: 'foundational',
    estimatedMin: 29,
    tags: ['activations', 'ReLU', 'GELU', 'vanishing gradients'],
    summary: `Build a 10-layer network, train it for an hour, and watch the loss barely budge. Peek inside: the last couple of layers are learning — their weights are moving — but the first eight are *frozen*. Now change one thing: swap the sigmoid activation for **ReLU**, retrain from scratch, and the whole thing comes alive — the loss drops, every layer updates, it converges. Nothing else changed. That single swap is one of the reasons deep learning became possible, and it comes down to one piece of arithmetic.

The **activation function** is the little non-linear squash applied after each layer — it is what lets a network bend space instead of only drawing straight lines. But it also decides whether the learning signal survives the trip backward through the layers.

---

**Sigmoid: the gradient killer.**

A sigmoid's slope is at most 0.25, and usually much smaller. Backprop multiplies that slope in at every layer, so through 10 sigmoid layers the signal reaching the first layer is scaled by about 0.25¹⁰ — around one in a million; through 20, essentially zero. The early layers stop learning, and a 10-layer network effectively acts like a 2-layer one. The fix is an activation whose slope does *not* shrink the signal — that is **ReLU** (just "keep positives, zero out negatives"), whose slope is a clean 1 for any active neuron. It passes the signal through untouched, and that is what finally made 20-plus-layer networks trainable.

[FIGURE: activations]

---

**ReLU's own flaw: the dead neuron.**

ReLU brought a new failure. If a neuron's input is negative for *every* training example — often after one too-large gradient step shoves its bias down — then ReLU outputs zero, its slope is zero, and it receives zero gradient *forever*. It is dead and never comes back. **Leaky ReLU** fixes this cheaply by giving negatives a tiny slope (0.01) instead of a flat zero, so a trickle of gradient always flows. **GELU** goes further with a smooth curve that never fully flatlines and softly gates each input by how positive it is — which is why BERT, GPT, and essentially every modern Transformer use it.

---

**One rule that is not up for debate: the output activation.**

All of the above is about the *hidden* layers. The *output* activation is a correctness constraint, not a preference. For a probability (binary classification) you must use **sigmoid**; for a set of class probabilities, **softmax**; for a plain number (regression), no activation at all. Putting a ReLU on the output of a classifier would let it emit nonsensical values — you match the output activation to what the answer is supposed to *be*, and that is a rule, not a tuning knob.`,
    interactivePrompt: `Before you touch the controls: a network has 10 sigmoid hidden layers — can you predict which layers will have the largest gradient norms, and which will have the smallest, before running any training?`,
    keyPoints: [
      `**Use GELU for hidden layers in Transformers and deep MLPs; use ReLU when compute is tight and the network is shallow (under 6 layers); use sigmoid only as an output activation for binary classification.** The output activation is a semantic constraint, not a tuning choice: sigmoid for probability outputs, softmax for multi-class distributions, linear for regression targets. Changing the output activation to match the loss function is correctness, not experimentation.`,
      `**The production trap: dying ReLU neurons that silently reduce model capacity.** A network trained with too-high a learning rate can have 20–30% of its ReLU neurons permanently dead after the first epoch — those neurons contribute nothing to any forward pass but still consume memory and compute. You will not notice from the loss curve alone. Monitor the fraction of dead neurons by checking how many neurons produce exactly zero output across a validation batch. Anything above 10% is a capacity problem. Fix: lower the learning rate, use a better initialiser, or switch to Leaky ReLU or GELU.`,
      `**The diagnostic: gradient norm ratio between first and last hidden layer.** Log the mean absolute gradient at each layer's weights after one backward pass. In a healthy 10-layer network with ReLU, the ratio should be within 10× between first and last layer. With sigmoid, expect 10⁶× or more — every layer of sigmoid compresses gradients by 4×. If you see a large ratio with ReLU, dying neurons are the cause: neurons with zero output contribute zero gradient to the weight update for that layer.`,
    ],
    takeaway: `The history of activation functions is a sequence of gradient-flow fixes: sigmoid killed gradients through saturation, ReLU fixed saturation but introduced dead neurons, GELU eliminated both — and each step unlocked a new generation of viable network depth.`,
    checkQuestions: [
      {
        q: `ReLU has a 'dying ReLU' problem. Explain mechanistically what causes it and what Leaky ReLU does to fix it.`,
        options: [
          `A) Dying ReLU occurs because ReLU saturates at large positive values — when pre-activations are very large, ReLU outputs the maximum representable float value and gradients become numerically unstable. Leaky ReLU prevents this by capping positive outputs at a maximum value, preventing the saturation that causes the dying problem.`,
          `B) Dying ReLU: if a neuron's pre-activation aᵢ = Wᵢx + bᵢ is negative for all training inputs, ReLU(aᵢ) = 0. Backward: ∂ReLU/∂a = 0 when a < 0. The gradient ∂L/∂Wᵢ = (∂L/∂hᵢ) × 0 = 0 for all samples. Weights receive zero gradient and never update — the neuron is permanently dead. This can happen after a large gradient step that pushes bᵢ very negative, or if weights initialise such that aᵢ < 0 for all training points. The proportion of dead neurons increases as learning rate increases. Leaky ReLU: f(a) = max(αa, a) where α = 0.01. For a < 0: f'(a) = α = 0.01 — small but nonzero gradient. Dead neurons can still receive a (small) gradient signal and potentially recover. Empirically, Leaky ReLU reduces the fraction of dead neurons but does not eliminate it entirely if α is very small.`,
          `C) Dying ReLU is caused by the vanishing gradient problem propagating backward through the network — neurons in early layers die because the gradient from the output layer has vanished by the time it reaches them, leaving their weights with zero updates. Leaky ReLU fixes this by amplifying the gradient for all neurons, ensuring even early layer neurons receive sufficient gradient signal.`,
          `D) Dying ReLU occurs because ReLU compresses both positive and negative pre-activations toward zero (similar to sigmoid saturation) — neurons with near-zero pre-activations have gradient ≈ 0. Leaky ReLU avoids this by adding a linear region that maintains gradient of 1 for both large positive and large negative pre-activations, preventing compression.`,
        ],
        answer: `B`,
      },
      {
        q: `Why does GELU outperform ReLU in transformer architectures? What is its mathematical definition?`,
        options: [
          `A) GELU uses a piecewise-quadratic approximation: GELU(x) = x² for x > 0 and 0 for x ≤ 0. This quadratic positive region provides stronger gradient signal than ReLU's linear positive region, allowing transformer attention layers to learn more complex nonlinear relationships. The smooth transition at x=0 also prevents the dead neuron problem that ReLU causes.`,
          `B) GELU is defined as GELU(x) = x · sigmoid(x), making it equivalent to Swish. It outperforms ReLU in transformers because it maintains a gradient everywhere — the sigmoid component ensures no hard zero for negative inputs. Transformers benefit from Swish-style activations because their bidirectional attention requires smooth gradient flow in both positive and negative directions.`,
          `C) GELU(x) = x · Φ(x) where Φ(x) is the CDF of the standard normal. Approximation: GELU(x) ≈ 0.5x(1 + tanh(√(2/π)(x + 0.044715x³))). GELU is a smooth, non-monotonic function: for large positive x, GELU ≈ x; for large negative x, GELU ≈ 0; near 0, GELU has a smooth transition with a slight dip below zero around x ≈ -0.17. GELU outperforms ReLU in transformers for: (1) Smoothness — no hard kink at x=0, which may improve gradient flow and optimisation landscape. (2) Probabilistic interpretation — GELU weights each input by its 'probability of being positive' under N(0,1), acting as a soft gating mechanism. (3) The slight negative region provides a form of regularisation (can produce negative activations). Empirically: BERT, GPT-2, and subsequent models consistently achieve lower perplexity with GELU than with ReLU.`,
          `D) GELU is defined as GELU(x) = max(0, x) + min(0, 0.01x), identical to Leaky ReLU with α=0.01. The renaming to GELU is specific to the transformer context where the same function is applied in a different architectural position (after layer normalisation rather than after a dense layer), which changes its effective behaviour relative to standard Leaky ReLU usage.`,
        ],
        answer: `C`,
      },
      {
        q: `Softmax output sums to 1 and is non-negative, so it is a valid probability distribution. However, neural networks trained with softmax are overconfident. Why?`,
        options: [
          `A) Softmax produces a probability distribution but does not guarantee calibration — the values are not necessarily probabilities of correctness. During training, cross-entropy loss drives the network to make the softmax output as close as possible to a one-hot distribution (1 for the correct class, 0 for others). To make softmax output approach 1 for the correct class, the model increases the logit for the correct class relative to others: softmax(z_correct/T)→1 as z_correct→∞. The model learns to output large logit gaps, making softmax outputs near 0 or 1. In test data: the model applies the same large-logit behavior even for inputs it has never seen or that are ambiguous. The high-confidence prediction comes from the trained weight magnitudes, not from actual reliability. Fix: temperature scaling, label smoothing (which prevents the model from driving logits to infinity during training).`,
          `B) Softmax overconfidence is a mathematical property of the softmax function itself: regardless of input logit values, softmax always amplifies the highest logit toward 1 and suppresses others toward 0. This amplification is proportional to the number of classes — more classes means more overconfidence — which is why overconfidence is primarily a problem in large multi-class settings rather than binary classification.`,
          `C) Softmax is overconfident because it produces a uniform distribution by default (when all logits are equal) rather than a maximally uncertain distribution (uniform should represent maximum uncertainty). Networks are trained to move away from the default uniform distribution, but this movement inherently pushes toward overconfidence because cross-entropy only penalises underconfidence in the correct class, not overconfidence in wrong classes.`,
          `D) Overconfidence arises because softmax normalises raw logits that can take any real value — the normalisation step itself introduces confidence that is not present in the underlying logits. A logit of 5 represents a very uncertain prediction, but after softmax normalisation it becomes 0.99 probability. The true confidence information is in the logit magnitudes, not the normalised probabilities.`,
        ],
        answer: `A`,
      },
    ],
    interactiveId: 'activation_functions',
    figures: {
      activations: `<svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="90" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">sigmoid</text>
  <line x1="25" y1="120" x2="160" y2="120" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="92" y1="130" x2="92" y2="35" stroke="var(--ink-low)" stroke-width="1"/>
  <path d="M28,116 C 70,116 78,50 92,50 C 106,50 114,42 156,42" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <text x="30" y="140" fill="var(--ink-low)" font-size="8">flat ends → slope fades to 0</text>
  <text x="270" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">ReLU</text>
  <line x1="205" y1="120" x2="340" y2="120" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="272" y1="130" x2="272" y2="35" stroke="var(--ink-low)" stroke-width="1"/>
  <path d="M210,120 L 272,120 L 335,45" fill="none" stroke="var(--amber)" stroke-width="2"/>
  <text x="212" y="140" fill="var(--ink-low)" font-size="8">slope = 1 when active</text>
</svg>`,
    },
  },
  {
    id: 'batch_norm',
    interactiveId: 'batch_norm_viz',
    title: 'Batch Normalisation & Regularisation',
    subtitle: 'BatchNorm, LayerNorm, Dropout, weight decay — why each works',
    difficulty: 'intermediate',
    estimatedMin: 31,
    tags: ['batch norm', 'layer norm', 'dropout', 'regularisation'],
    summary: `Take a 10-layer network mid-training. Layer 5 tweaks its weights — fine. But layer 6 had learned to expect a certain *distribution* of numbers coming from layer 5, and that distribution just moved. So layer 6 scrambles to adjust, which shifts what layer 7 sees, and so on up the stack. Every layer is chasing a moving target created by the layers below it. To keep this from blowing up, you are forced to use a tiny learning rate so no single update destabilises everything above it — and training crawls. This wobble was one of the big reasons deep networks were so fragile to train before 2015.

**Batch normalisation** fixed it with a simple idea: at each layer, before passing the numbers on, *re-centre and re-scale them* so they have a consistent, tidy distribution (mean 0, spread 1) across the batch. Now layer 6 always sees inputs in a familiar range no matter what layer 5 did, and the moving-target problem largely goes away. (It also keeps a pair of learned dials, γ and β, that let the network re-stretch the numbers if the task actually needs it, so nothing is lost.) The payoff is big: you can crank the learning rate 5–10× higher, the network stops caring so much about initialisation, and training converges much faster.

---

**A happy side effect: free regularisation.**

Here is a subtlety that turns out to matter. The mean and spread used to normalise are computed from the *current mini-batch* — so the exact same example gets normalised a little differently depending on which other examples happen to share its batch. That tiny, ever-changing jitter acts like a mild regulariser: the network cannot lean too hard on any one example's exact representation, because that representation keeps shifting. (Later work argued this "smoothing the loss landscape" effect, more than the moving-target story, is the real reason batch norm helps so much.)

---

**Batch norm vs layer norm — not interchangeable.**

There is a second normaliser, **layer norm**, and picking the wrong one is a genuine error, not a tuning choice. Batch norm normalises each feature *across the batch* — which only makes sense if the examples in a batch are comparable. In a Transformer chewing through tokens from different positions in different sentences, "the average of this feature across the batch" is semantic nonsense. Layer norm instead normalises *across the features of a single example*, so it is well-defined for one token at a time, at any position, with any batch size. That is why every Transformer uses layer norm, and CNNs on images use batch norm.

(One practical gotcha with batch norm: at inference you have no batch, so it switches to running averages collected during training. Forget to flip the model into eval mode and a single-example prediction gets normalised against a batch of one — which quietly produces garbage, with no error.)`,
    interactivePrompt: `Before you touch the controls: if you forget to call model.eval() at inference time with batch norm, what happens to a single-sample prediction — and why would it fail silently rather than throwing an error?`,
    keyPoints: [
      `**Batch norm for CNNs on images (batch size ≥ 16); layer norm for Transformers, RNNs, and any variable-length or small-batch task.**\n\nThe choice comes from what the statistics *mean*, not from tuning. Batch norm needs a batch of at least ~8 comparable examples or its per-batch estimates are too noisy to help. And always switch the model to eval mode at inference, so it uses the running averages instead of a (possibly size-1) batch — forgetting this is the single most common silent failure in deployed vision models.`,
      `**The trap: batch norm's train-versus-inference mismatch.**\n\nDuring training each example is normalised using its mini-batch's mean and spread; at inference the model uses running averages collected during training. If the input distribution shifts — new data source, different camera, different preprocessing — those stored averages are stale and the normalisation is wrong, and accuracy degrades with no error, no NaN, no warning. Fix it by running a few forward passes over data from the new distribution (in train mode) to refresh the running statistics before switching back to eval.`,
      `**The diagnostic: compare training loss at a large batch versus a small one.**\n\nIf the same model trains noticeably worse and noisier at batch size 4 than at 32, batch norm is the culprit — with only four samples the per-batch mean and variance are poor estimates and destabilise the normalisation. Swap in group norm or layer norm and re-run; if the gap closes, that confirms it.`,
    ],
    takeaway: `Normalisation stabilises the optimisation landscape so training converges; regularisation reduces capacity so the solution generalises — conflating the two is the source of most tuning mistakes.`,
    checkQuestions: [
      {
        q: `Batch normalisation has four parameters per feature: γ, β, μ_batch, σ_batch. Which are learned and which are computed? What happens at inference time?`,
        options: [
          `A) Structural difference: Batch Norm normalises across the batch dimension (for each feature/channel, normalize over all samples in the batch). Layer Norm normalises across the feature dimension (for each sample, normalize over all features). BN is preferred for: CNNs with large batch sizes on image tasks — normalising per-channel over the batch is stable and effective. BN struggles when batch size is small (batch statistics are noisy) or when examples are dissimilar (different sequence lengths, etc.). Layer Norm is preferred for: Transformers, RNNs, and NLP tasks — sequences have varying lengths, making batch normalisation across unaligned sequence positions incoherent. Each token's representation is normalised over its own feature dimensions, which is well-defined regardless of batch size or sequence length. LN is batch-size-independent, making it reliable for small-batch or online learning.`,
          `B) All four are learned during training: γ and β are trained by gradient descent to restore expressive capacity after normalisation; μ_batch and σ_batch are trained via exponential moving averages to track the data distribution. At inference, the same four learned parameters are used directly without recomputing anything from the current input.`,
          `C) Only γ (scale) is learned; β (shift), μ_batch (mean), and σ_batch (std) are all computed from the data. At inference time, β is computed from the running average of biases across training, and μ_batch and σ_batch are computed fresh from each inference batch to maintain accurate normalisation statistics.`,
          `D) Computed from data (not learned): μ_batch = mean over batch; σ_batch = std over batch — these are statistics computed from the current mini-batch during training. Learned (trainable parameters): γ (scale) and β (shift) per feature — these allow the network to undo normalisation if needed, restoring representational power. At inference time: no batches, so batch statistics cannot be computed. Instead, running averages of mean and variance accumulated during training are used: μ_running and σ_running. These are not trained by gradient descent; they are maintained using exponential moving averages: μ_running ← 0.9·μ_running + 0.1·μ_batch at each training step. At test time: output = γ·(x − μ_running)/σ_running + β — fully deterministic, using fixed statistics.`,
        ],
        answer: `D`,
      },
      {
        q: `Why does batch normalisation act as a regulariser, reducing the need for dropout? Explain the mechanism.`,
        options: [
          `A) BN acts as a regulariser because it clips extreme activation values by normalising to unit variance — any activation more than a few standard deviations from the mean gets compressed toward zero. This clipping prevents neurons from learning to rely on extreme activation patterns, which is the same mechanism by which weight decay prevents over-reliance on any single weight dimension.`,
          `B) BN's regularisation comes from the stochasticity of batch statistics: each mini-batch has different μ_batch and σ_batch (random samples from the full dataset). The normalised value x̂ᵢ = (xᵢ − μ_batch)/σ_batch depends on all other examples in the batch — the normalisation creates a noisy transformation. This noise acts like a regulariser: the network cannot memorise the training set as easily because the representation of any example changes depending on which other examples appear in the batch. Larger batch sizes reduce this noise (means and variances converge to constants) — this is why very large-batch training (B=4096+) benefits less from BN's regularisation effect. Additionally, BN smooths the loss landscape, allowing higher learning rates and faster convergence, which can itself act as implicit regularisation.`,
          `C) BN regularises by forcing all intermediate activations to have identical distributions (zero mean, unit variance) — this prevents co-adaptation between layers where one layer's output distribution is tuned to another layer's input preferences. Dropout regularises by preventing co-adaptation within a single layer's neurons, so they address different types of co-adaptation and are entirely complementary with no overlap in regularisation effect.`,
          `D) BN acts as a regulariser by increasing gradient magnitudes uniformly across all layers, which counteracts the tendency of gradient descent to make large updates to weights in layers with high activation variance. The more uniform gradient flow prevents any single layer from being updated disproportionately, distributing the regularisation effect across the network depth.`,
        ],
        answer: `B`,
      },
      {
        q: `Layer normalization vs batch normalization: when do you use each, and what is the key structural difference?`,
        options: [
          `A) Structural difference: Batch Norm normalises across the batch dimension (for each feature/channel, normalize over all samples in the batch). Layer Norm normalises across the feature dimension (for each sample, normalize over all features). BN is preferred for: CNNs with large batch sizes on image tasks — normalising per-channel over the batch is stable and effective. BN struggles when batch size is small (batch statistics are noisy) or when examples are dissimilar (different sequence lengths, etc.). Layer Norm is preferred for: Transformers, RNNs, and NLP tasks — sequences have varying lengths, making batch normalisation across unaligned sequence positions incoherent. Each token's representation is normalised over its own feature dimensions, which is well-defined regardless of batch size or sequence length. LN is batch-size-independent, making it reliable for small-batch or online learning.`,
          `B) Structural difference: Batch Norm normalises across all features within each sample (same as Layer Norm), but Batch Norm additionally learns a separate scale/shift per sample (γᵢ, βᵢ for sample i), while Layer Norm uses a single shared γ and β across the entire batch. Use BN when you have consistent sample types in each batch; use LN when samples are heterogeneous or come from different distributions.`,
          `C) Layer Norm and Batch Norm differ only in whether they use a moving average at inference: BN uses exponential moving averages of batch statistics computed during training, while LN recomputes fresh statistics from each inference sample. For CNNs, LN is preferred because image classification batches are typically homogeneous, so fresh per-sample statistics are more accurate than accumulated moving averages.`,
          `D) Structural difference: Layer Norm normalises across the batch dimension (computing mean and variance over all samples in the batch for each feature), while Batch Norm normalises across the feature dimension (computing mean and variance over all features for each sample). This is the opposite of their common descriptions — Layer Norm's name refers to its application to entire network layers, not to the normalisation axis.`,
        ],
        answer: `A`,
      },
    ],
    interactiveId: 'batch_norm_viz',
  },
  {
    id: 'optimizers',
    interactiveId: 'gradient_descent',
    title: 'Deep Learning Optimisers',
    subtitle: 'SGD, momentum, RMSProp, Adam, AdaGrad — convergence and learning rate schedules',
    difficulty: 'intermediate',
    estimatedMin: 31,
    tags: ['optimisers', 'Adam', 'SGD', 'learning rate', 'momentum'],
    summary: `You are training a ResNet on ImageNet with plain SGD at a fixed learning rate. After 30 epochs the loss flattens out. You switch to **Adam**, and in the next 5 epochs it drops more than it did in the previous 30. What just happened — and why might plain SGD still win in the end?

The core issue with one fixed learning rate is that different weights have wildly different lives. A weight in the embedding for a rare word might get a gradient once in a thousand steps; a weight in the final layer gets one every step. The same step size cannot suit both — the rare one needs a big push to make progress from its infrequent updates, the busy one needs small steps to avoid bouncing around its target. **Adaptive optimisers** fix this by giving *each* weight its own effective learning rate, based on its gradient history.

---

**The lineage: AdaGrad → RMSProp → Adam.**

**AdaGrad** came first: for each weight, add up its squared gradients and divide the step by the square root of that sum. Rarely-updated weights (small sum) get big steps; busy weights get small ones. Perfect for sparse problems like word embeddings — but it has a flaw: the sum only ever grows, so on dense problems the step size eventually shrinks to nothing and learning stalls. **RMSProp** fixes that by using a *decaying* average of squared gradients, so ancient history fades and the step size never collapses. **Adam** then adds momentum on top: it keeps a running average of the gradients themselves (a velocity, to smooth the direction) *and* a decaying average of squared gradients (the adaptive scale). The combination converges fast on almost anything, which is why Adam is the default for most deep learning.

---

**So why does SGD sometimes win?**

Here is the twist. On image-classification benchmarks, a well-tuned **SGD with momentum** often *beats* Adam on validation accuracy, even though Adam trains faster. The reason ties back to the sharp-versus-flat-minima idea: Adam's per-weight rescaling lets it slide neatly into the *nearest* minimum, which tends to be a sharp, narrow one. Plain SGD keeps more of its gradient noise, which jostles it toward *flatter, wider* minima — and flat minima generalise better, especially when the test data drifts from training. So the trade is real: Adam gives you speed, SGD (tuned, with patience) can give a slightly better final model. Whichever you use, never leave the learning rate fixed for the whole run — decay it over time, and for Transformers *warm it up* first (start tiny and ramp up over the first few thousand steps), or the early, unreliable gradients will blow training up.`,
    interactivePrompt: `Before you touch the controls: if Adam uses a different effective learning rate for every parameter, what happens to a parameter whose gradient has been consistently near-zero for 1000 steps — does it get a large or small update next?`,
    keyPoints: [
      `**Adam (or AdamW) when training speed matters; SGD+momentum for image classification when you want the best generalisation and can afford a full run.**\n\nAdam is the safe default for Transformers and NLP. For vision with a big compute budget, well-tuned SGD+momentum often edges ahead on validation accuracy. And whenever you add weight decay to Adam, use **AdamW**: plain Adam's L2 penalty gets distorted by the per-parameter rescaling, while AdamW applies the decay uniformly — always prefer it.`,
      `**The trap: running Adam on a Transformer with no learning-rate warmup.**\n\nAt the very start, Adam's running estimates have no history, so the first few hundred steps take confident, full-size steps in noisy, unreliable directions — and the loss spikes or diverges in the first epoch. Ramp the learning rate up from near-zero over the first 1,000–4,000 steps so the estimates can settle before big updates land. Missing warmup is the most common cause of early Transformer training blow-ups.`,
      `**The diagnostic: plot training and validation loss per optimiser, not just final accuracy.**\n\nIf Adam reaches a lower *training* loss but the same or worse *validation* loss than SGD, it has found a sharper minimum, not a better one — and sharp minima are exactly what a shift in the test distribution punishes. If your deployment data differs from training, lean toward SGD's flatter optima; if training speed is the bottleneck, take Adam and accept the trade-off.`,
    ],
    takeaway: `Adam converges faster but lands in sharper minima; SGD+momentum is slower but finds flatter optima that generalise better under distribution shift — the choice is training speed versus the generalisation ceiling, and neither should ever run at a fixed learning rate for the full training run.`,
    checkQuestions: [
      {
        q: `Adam is used with default parameters (β1=0.9, β2=0.999, ε=1e-8). Training loss decreases but validation loss starts increasing after epoch 10. Should you change the optimizer or change regularisation?`,
        options: [
          `A) Change the optimizer: the diverging validation loss indicates Adam's adaptive learning rates are too aggressive. The β2=0.999 parameter means Adam remembers 999 past gradient magnitudes for every 1 new gradient — this excessive memory prevents Adam from reducing the learning rate quickly enough when validation loss starts rising. Switch to SGD+momentum (β=0.9), which reduces the learning rate more responsively based on current gradient direction.`,
          `B) Change both simultaneously: the validation loss increase after epoch 10 is caused by Adam's adaptive learning rates overfitting to the training loss landscape (a known failure mode of Adam). Add weight decay via AdamW to address the optimizer issue, and simultaneously reduce β2 from 0.999 to 0.99 to make the adaptive rates more responsive to the current loss surface.`,
          `C) The diverging train/validation loss indicates overfitting — a data/regularisation problem, not an optimizer problem. Adam is not causing the overfitting; it is merely optimising the loss function you gave it. Changing optimizer parameters would not fix overfitting. Actions: (1) Add/increase weight decay — use AdamW with weight_decay=0.01-0.1 instead of Adam (Adam+L2 does not regularise correctly as explained by the non-uniform gradient scaling). (2) Add dropout if not present. (3) Reduce model capacity if data is limited. (4) Add data augmentation. (5) Use early stopping at epoch 10 as a temporary fix. The question 'optimizer vs regularisation' is a false dichotomy — Adam is fine, but the training objective lacks sufficient regularisation. AdamW is the correct drop-in replacement that adds proper weight decay.`,
          `D) Change the optimizer parameters: increasing β1 from 0.9 to 0.95 gives Adam more momentum, causing it to overshoot validation optima less. The validation loss increase after epoch 10 is a symptom of Adam oscillating around the validation minimum, which higher momentum dampens by averaging over more gradient history.`,
        ],
        answer: `C`,
      },
      {
        q: `Compare Adam and SGD+momentum on the training loss curves: Adam converges faster in early epochs, SGD is slower but eventually matches or beats Adam on validation. Why?`,
        options: [
          `A) Adam's adaptive per-parameter learning rates accelerate early convergence: rare parameters get large effective learning rates, frequent ones get small. In early training, this fast adaptation quickly reduces loss. Adam's per-parameter scaling also reduces gradient noise more aggressively (by dividing by √v̂ which grows large in high-gradient directions), effectively finding narrow gradient directions quickly. However, Adam's reduced noise means it converges toward the nearest minimum, which tends to be sharper (higher local curvature). SGD+momentum with a fixed learning rate explores more broadly — the uniform learning rate retains more gradient noise, allowing the optimizer to escape sharper basins and find flatter minima that generalise better. The SGD generalization advantage is task- and tuning-dependent; on NLP tasks, Adam is often competitive. On vision tasks (especially with batch normalization), well-tuned SGD+momentum typically reaches 1-2% higher test accuracy.`,
          `B) Adam's faster early convergence is due to higher effective batch size: the second moment estimate √v̂ normalises the gradient to have unit variance, which is equivalent to processing more samples per step. SGD processes fewer effective samples per step, giving it lower training speed but more stochastic exploration. The flatter minima SGD finds result from its lower effective sample efficiency, not from any property of gradient noise.`,
          `C) Adam converges faster in early epochs because it uses a higher implicit learning rate (the bias correction terms make the effective first-step learning rate equal to α/(1-β₁), which is 10× α for β₁=0.9). SGD's lower effective learning rate in early epochs forces more conservative updates that accidentally explore more of the loss landscape before converging — this exploration advantage compounds to produce better generalisation.`,
          `D) Adam converges faster because its adaptive learning rates are equivalent to second-order optimisation: the v̂ denominator approximates the diagonal Hessian, making Adam an approximate Newton's method. SGD+momentum only uses first-order gradient information and is therefore slower. However, second-order methods tend to overfit because they converge more precisely to the training loss minimum, explaining SGD's better generalisation.`,
        ],
        answer: `A`,
      },
      {
        q: `A new dataset is available and you are fine-tuning a pre-trained ResNet with Adam. The last layer is randomly initialised, the rest are pre-trained. What learning rate do you use for each part?`,
        options: [
          `A) Use the same learning rate for all layers (e.g., 1e-3) but with a weight decay 100× higher on the pre-trained layers compared to the last layer. Weight decay serves as the mechanism for preserving pre-trained knowledge — it prevents large weight changes without requiring different learning rates, and a single learning rate with differential regularisation is simpler to tune.`,
          `B) Use a higher learning rate for the pre-trained layers (e.g., 1e-3) and a lower one for the randomly initialised last layer (e.g., 1e-5). The pre-trained layers need to adapt more aggressively to the new task's feature requirements, while the randomly initialised last layer should update conservatively to avoid gradient instability from its random starting point.`,
          `C) Use identical learning rates for all layers, but train in two phases: first train only the last layer for several epochs to converge its random weights, then unfreeze all layers and train jointly at the same learning rate. Differential learning rates are unnecessary because Adam's adaptive mechanism automatically scales updates based on gradient history — layers with pre-trained weights receive naturally lower updates because their gradient history is already accumulated.`,
          `D) Differential learning rates: pre-trained layers should use a much smaller learning rate (e.g., 1e-5 or 1e-4) than the randomly initialised last layer (e.g., 1e-3 or 1e-2). The pre-trained weights encode useful representations learned from the large source dataset — large updates would destroy this knowledge (catastrophic forgetting). The last layer has random weights that need substantial updates to fit the new task's classification boundaries. In PyTorch/fastai: set param_groups with different lr values. A common schedule: freeze pre-trained layers for the first few epochs (train only the last layer), then unfreeze all with differential rates — the '1cycle' fine-tuning schedule. The ratio of 10x-100x between last layer and earlier layers is typical. If the new dataset is very similar to the source, use smaller differential; if very different (e.g., medical imaging from ImageNet pre-trained model), larger differential.`,
        ],
        answer: `D`,
      },
    ],
  },
  {
    id: 'cnns',
    title: 'Convolutional Neural Networks',
    subtitle: 'Convolution mechanics, pooling, receptive field, translation equivariance',
    difficulty: 'intermediate',
    estimatedMin: 31,
    tags: ['CNN', 'convolution', 'pooling', 'receptive field', 'computer vision'],
    summary: `Take a 28×28 MNIST digit — 784 raw pixels. Feed them into a flat linear layer of 128 units and you need 784×128 = 100,352 parameters just for that one layer. More importantly, the model treats pixel (3,4) and pixel (3,5) as completely independent inputs. There is nothing in the architecture that says these two pixels are neighbors, that they participate in the same local edge, or that an edge at position (3,4) is the same kind of feature as an edge at position (15,20). The flat model must separately learn that connection for every pair of positions. Spatial structure is invisible to it.

Convolution is the solution to that invisibility. A 3×3 filter slides across the image, computing a dot product at every position: the same 9 weights applied at (3,4), at (15,20), and at every other location. That is weight sharing — the filter has 9 parameters regardless of image size. When the filter learns to detect a horizontal edge, it detects horizontal edges everywhere, because the same weights do the computation everywhere. A flat linear layer needs 100K parameters to do what a single convolutional filter does with 9. Pooling takes the output of a filter across a small spatial region and keeps only the maximum: if the edge appeared slightly left or slightly right, the pooled value is the same. This builds position invariance. Stack several layers: the first layer detects edges, the second layer detects combinations of edges into corners and curves, the third detects shapes, the fourth detects objects. Each neuron at a deep layer "sees" a large portion of the original image because its receptive field grows with each convolution — a neuron at layer 5 of a 3×3-stride-1 network has a receptive field of 11×11 pixels in the original image, seeing a neighborhood that spans multiple objects.

**NOT this.** "CNNs were designed for images." The principle — local patterns plus translation equivariance — applies anywhere locality matters. 1D CNNs classify audio and DNA sequences, where adjacent time steps or nucleotides are locally related. 3D CNNs process video, where nearby frames in time are locally correlated. Graph CNNs extend the idea to molecular structures and social networks. The architecture is not about pixels; it is about exploiting whatever spatial or sequential structure your data has. If your input has the property that neighboring elements are more related than distant elements, a convolutional inductive bias is appropriate. If your input is a bag of features with no meaningful ordering, it is not.`,
    keyPoints: [
      `**Use CNNs over MLPs whenever the input has local structure — weight sharing cuts parameters 10–100× and builds in the right inductive bias.**\n\nA flat MLP applied to a 224×224 image needs 150M parameters in the first layer alone. A convolutional layer with 64 filters of size 3×3 needs 64×9×3 = 1,728 parameters, regardless of image size. The accuracy gain is not from having more parameters — it is from encoding the assumption that local patterns repeat, which is correct for images, audio, and sequences.`,
      `**Trap: deepening a CNN without residual connections kills gradients — VGG-19 was state of the art; ResNet-152 beat it by simply adding skip connections. Depth without residuals is not free.**\n\nWith plain convolutions, a 50-layer network was harder to train than a 34-layer network — more depth actually hurt. The skip connection output = F(x) + x gives the gradient a direct path: ∂L/∂x includes the identity term regardless of what F does. This one change unlocked reliable training at 100+ layers. If your CNN depth is above ~10 layers and you are not using residuals, the network is likely training with near-zero gradient in early layers.`,
      `**Diagnostic: if early-layer filters look like random noise after training, the network is not learning — check learning rate, initialization, and whether input is normalized.**\n\nHealthy early filters in a CNN trained on images look like oriented edge detectors and color blobs — not random static. Visualize the first-layer weights after 1 epoch. If they are still indistinguishable from the initialization, the gradient is not reaching them. Candidate causes: learning rate too small for the layer depth, missing or wrong normalization on inputs, or vanishing gradients from missing residuals.`,
    ],
    interactivePrompt: `Before you touch the controls: a 3×3 filter applied with stride 1 to a 28×28 image produces a 26×26 output — if you stack three such layers, what is the receptive field of a single output neuron in the final layer, and does it see the full image?`,
    checkQuestions: [
      {
        q: `A convolutional layer has filter size 3×3, 64 input channels, 128 output channels. How many parameters? How does this compare to a fully connected layer with the same input/output dimensions?`,
        options: [
          `A) Conv layer: each of 128 filters has 3×3×64 = 576 weights + 1 bias = 577 parameters. Total: 128 × 577 = 73,856 parameters. FC layer equivalent (input dimension = H×W×64 for an H×W feature map, output = H×W×128): parameters = (H×W×64) × (H×W×128). For H=W=28: input_dim = 28×28×64 = 50,176; output_dim = 28×28×128 = 100,352; parameters = 50,176 × 100,352 ≈ 5×10⁹. The convolutional layer's weight sharing (same 576 weights applied at each spatial location) is the key efficiency: 73,856 vs ~5 billion parameters. This reduction comes from translation equivariance assumption: the same filter is useful at every spatial position. Parameter sharing also enables learning from less data and improves generalisation.`,
          `B) Conv layer: 128 filters × 3×3 weights = 1,152 parameters (input channels are processed independently in depthwise convolutions, so the 64 input channels don't multiply the parameter count). FC layer equivalent: 64 × 128 = 8,192 parameters — fewer than the conv layer, which is why depthwise-separable CNNs are more efficient than standard CNNs at the same spatial dimensions.`,
          `C) Conv layer: 3×3×64×128 = 73,728 weights only — biases are not used in modern conv layers because batch normalisation makes biases redundant (BN's β parameter serves the same role). FC layer equivalent: same 73,728 parameters, because an FC layer with H×W=1 spatial size is mathematically identical to a conv layer with a 1×1 kernel.`,
          `D) Conv layer: each of 128 filters has 3×3 = 9 weights + 1 bias = 10 parameters per filter (input channels are implicitly handled by the architecture, not the parameter count). Total: 128 × 10 = 1,280 parameters. FC layer equivalent: 64 × 128 = 8,192 parameters — 6× more than the conv layer, showing modest savings from weight sharing at this scale.`,
        ],
        answer: `A`,
      },
      {
        q: `Why does max pooling help with spatial invariance, and what is the downside for tasks requiring precise localisation?`,
        options: [
          `A) Max pooling helps with spatial invariance by computing the mean activation over each pooling window — the average is insensitive to small shifts within the window because nearby pixels tend to have similar values. The downside for localisation is that mean pooling loses sharp boundary information, making segmentation contours blurry because edge activations are diluted by surrounding non-edge values.`,
          `B) Max pooling provides spatial invariance by selecting the dominant feature in each region, which helps the network focus on the presence of features rather than their precise location. The downside is that max pooling discards the activation values of non-maximum neurons entirely — for localisation tasks, those discarded activations contain the gradient signal needed to pinpoint feature boundaries precisely.`,
          `C) Max pooling provides spatial invariance because it normalises activation magnitudes within each window to the maximum value, making the network insensitive to lighting and contrast variations rather than spatial position. The localisation downside is that max-normalised features can no longer be compared across different spatial scales, making multi-scale object detection harder.`,
          `D) Max pooling over a 2×2 region takes the maximum activation in each 2×2 window, reducing spatial resolution by 2×. If a feature (e.g., edge at pixel (10,10)) shifts to (11,10), it is still within the same 2×2 pool window — the max-pooled output is the same. Max pooling provides local translation invariance: small shifts of features don't change the output. Stacking multiple pooling layers accumulates this invariance across larger regions. Downside for localisation: spatial information is lost. After 2-3 pooling layers (8× reduction), the exact location of a feature is discarded — you know it existed in an 8×8 input region but not where. For segmentation (pixel-level prediction) and object detection (bounding box prediction), we need spatial information preserved. Solutions: skip connections (U-Net preserves spatial info via skip paths), deconvolution/transposed convolution (upsampling with learned weights), or stride-1 convolutions without pooling (dilated convolutions for receptive field growth without spatial reduction).`,
        ],
        answer: `D`,
      },
      {
        q: `What is the receptive field of a neuron after three 3×3 convolutional layers (no pooling)? Why does depth matter for receptive field size?`,
        options: [
          `A) After three 3×3 layers, the receptive field is 9×9 (each layer triples the receptive field: 3 → 9 → 27 but capped by output size, so effectively 9×9). Depth matters because receptive fields grow multiplicatively with depth — each additional 3×3 layer multiplies the receptive field by 3, which is why 3 layers of 3×3 convolutions are equivalent to a single 27×27 convolution. This multiplicative growth is far more efficient than the additive growth claimed for stacked filters.`,
          `B) After three 3×3 layers, the receptive field is 3×3 regardless of depth — each 3×3 filter sees a 3×3 region of its input, but since the output of each layer feeds the next, the spatial size of the feature map shrinks rather than the receptive field growing. Depth helps by creating a hierarchy of 3×3 features, not by expanding the spatial receptive field size.`,
          `C) Layer 1: each 3×3 filter sees a 3×3 region of the input. Layer 2: each 3×3 filter sees a 3×3 region of layer 1 output, which each sees 3×3 of input. Total: 5×5 receptive field. Layer 3: 3×3 of layer 2 output, which sees 5×5 of input. Total: 7×7 receptive field. General formula: RF_depth = 2×depth + 1 for consecutive 3×3 layers. Depth matters because: large receptive fields are needed to detect large-scale patterns (objects, scenes). A single large kernel (e.g., 7×7) would achieve the same RF as three 3×3 layers but with more parameters (49 vs 3×9=27 weights per filter) and fewer nonlinearities (1 ReLU vs 3 ReLUs). Three 3×3 layers with three ReLUs can represent more complex functions than one 7×7 layer with one ReLU, at lower parameter cost. This is the fundamental justification for VGG-style deep networks using small filters.`,
          `D) After three 3×3 layers with no pooling, the receptive field remains 3×3 because stride-1 convolutions do not expand the spatial context — each layer's filter still only sees a 3×3 patch of its immediate input. Receptive field growth requires either stride > 1 or pooling layers between convolutions. The three 3×3 layers achieve better feature abstraction than a single 3×3 layer, but only pooling can expand the spatial receptive field.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `A CNN's efficiency comes entirely from weight sharing: the same filter applied everywhere encodes the assumption that features repeat across space, cutting parameters 100× versus a flat model and building translation equivariance into the architecture by construction.`,
  },
  {
    id: 'rnns_lstms',
    interactiveId: 'rnn_viz',
    title: 'RNNs & LSTMs',
    subtitle: 'Vanishing gradient in sequences, gate mechanisms, hidden state, when to still use them',
    difficulty: 'intermediate',
    estimatedMin: 31,
    tags: ['RNN', 'LSTM', 'GRU', 'vanishing gradient', 'sequential data'],
    summary: `Try to classify the sentiment of "The movie was not good." Process it token by token with a vanilla RNN. At each step, the hidden state h_t is updated: h_t = tanh(W_h · h_{t-1} + W_x · x_t). By the time the model reaches "good," it needs to remember that "not" appeared two steps earlier to get the sentiment right. The gradient of the loss with respect to h_0 — the state that captured "not" — must travel back through 4 Jacobian matrices, one per timestep. Each Jacobian for the tanh activation has a spectral radius that, on average, is less than 1. Multiply four of them together and the gradient shrinks: if each Jacobian contributes a factor of 0.5, the combined factor is 0.5⁴ = 0.0625. After 20 steps the factor is 0.5²⁰ ≈ 10⁻⁶. The model cannot learn that "not" reverses the sentiment — the signal from that early token cannot reach the loss gradient strongly enough to update the corresponding weights.

The LSTM was designed specifically to defeat this. Rather than passing the gradient only through the hidden state h_t, it adds a cell state C_t with an additive update path: C_t = f_t ⊙ C_{t-1} + i_t ⊙ g_t. The forget gate f_t ∈ (0, 1) decides how much of the previous cell state to keep. The gradient of C_t with respect to C_{t-1} is f_t — and the LSTM can learn to keep f_t near 1 for timesteps where memory should be preserved. When f_t ≈ 1, the gradient flows backward through the cell state unchanged, giving the early token a direct path to the loss. The input gate i_t decides what new information to write to the cell state. The output gate o_t decides what to expose as the hidden state h_t = o_t ⊙ tanh(C_t). The GRU achieves similar behavior with two gates instead of four, fewer parameters, and empirically comparable performance on most tasks.

**NOT this.** "Transformers made RNNs obsolete." For offline NLP with the full sequence available, transformers win on almost every benchmark. But RNNs remain the correct tool for streaming inference: when you are processing an audio stream, a live trading feed, or a robotics sensor reading, you do not have the full sequence at inference time. Transformer attention requires all positions to be present simultaneously — O(n²) memory to compute the attention matrix. An RNN processes each new token in O(1) with fixed memory. For sequences beyond ~16K tokens where attention memory becomes prohibitive, or for tasks with strict sequential causality and real-time constraints, the RNN is not a fallback — it is the right architecture.`,
    keyPoints: [
      `**Use LSTMs for sequential tasks where the full sequence is not available at inference time — streaming audio, live trading, real-time sensor processing.**\n\nTransformer attention requires all positions simultaneously; an LSTM processes each new token in O(1) with fixed memory. That is the decision boundary: if inference is sequential and unbounded, use an LSTM. If inference can wait for the full sequence and length is under ~16K tokens, use a Transformer.`,
      `**Trap: vanishing gradient is not fully fixed by LSTMs for all sequence lengths. Beyond ~200 steps even LSTMs struggle — for long-range dependencies in offline settings, attention is strictly better.**\n\nThe forget gate keeps gradients alive by learning f_t ≈ 1, but it is learned under gradient pressure from the task. For dependencies spanning hundreds of steps, the gradient through the cell state path still attenuates — product of 200 forget gate values, each slightly below 1, compounds. LSTMs win over vanilla RNNs at 20–50 steps. For 500+ steps with the full sequence available, use attention.`,
      `**Diagnostic: plot gradient norms per time step during backpropagation through time — if the norm at step 1 is < 1e-4 while step T is 1.0, you have vanishing gradients regardless of LSTM gates.**\n\nHook into the backward pass and log ‖∂L/∂h_t‖ for each t. A healthy LSTM should show gradient norms decaying by at most ~100× from the last timestep to the first for sequences under 100 steps. Exponential decay is the vanishing gradient signature. Check that forget gate biases are initialized to 1.0 (not 0.0) — a forget bias of 0 means sigmoid(0) = 0.5, which already shrinks the cell state gradient path by half at every step from initialization.`,
    ],
    interactivePrompt: `Before you touch the controls: if the forget gate f_t is a sigmoid and is initialized at 0.5 for all timesteps, estimate how much the gradient attenuates across a 10-step sequence through the cell state path alone.`,
    checkQuestions: [
      {
        q: `An LSTM processes a sequence of length 200. Where does the gradient come from for updating W_h (the hidden-to-hidden weight) at timestep 1?`,
        options: [
          `A) In BPTT (backpropagation through time), the gradient ∂L/∂W_h at t=1 is: ∂L/∂W_h|_{t=1} = (∂L_T/∂h_T)·(∂h_T/∂h_{T-1})·...·(∂h_2/∂h_1)·(∂h_1/∂W_h). This product of 199 Jacobians ∂hₜ/∂h_{t-1} gives the gradient. In a vanilla RNN, each factor contains tanh'(·)·W_h, and the product of 199 such terms leads to either vanishing (‖W_h‖ < 1) or exploding (‖W_h‖ > 1) gradients. In an LSTM, the gradient also flows through the cell state pathway: ∂c_t/∂c_{t-1} = f_t (forget gate). If f_t ≈ 1 (remember everything), this is an approximately unobstructed gradient highway across 200 timesteps. The forget gate values depend on the input and are trained to be near 1 for long-range dependencies, preserving the gradient for W_h updates at early timesteps.`,
          `B) The gradient for W_h at t=1 comes exclusively from the loss at t=1 — the local loss L₁. In BPTT, each timestep's W_h update uses only the loss computed at that timestep, not future losses. The total gradient is the sum ∂L₁/∂W_h + ∂L₂/∂W_h + ... + ∂L₂₀₀/∂W_h, where each term is computed independently from the local loss without any gradient propagation across time.`,
          `C) In an LSTM, W_h is updated only from the gradient at the final timestep T=200, because the hidden state h₂₀₀ is the only output used for the loss. All intermediate hidden states h₁,...,h₁₉₉ are internal to the sequence processing and do not receive gradient signals — the LSTM's gating mechanism prevents gradients from flowing backward through intermediate timesteps to protect the stored cell state.`,
          `D) The gradient for W_h at t=1 flows backward from the loss through the output gate only — the forget and input gates block gradient propagation to preserve the cell state's long-range memory. This gated gradient flow means W_h at early timesteps receives gradient only from the output gate pathway, which is trained separately from the cell state pathway.`,
        ],
        answer: `A`,
      },
      {
        q: `What is the key mathematical difference between an LSTM cell and a GRU cell? When would you prefer one over the other?`,
        options: [
          `A) The key mathematical difference is that LSTM uses multiplicative gating (gates ∈ (0,1) that multiply cell state values), while GRU uses additive gating (gates that add to cell state values). This means LSTM can completely suppress or pass information (values approach 0 or 1), while GRU can only shift information values, making LSTM strictly more expressive for binary memory tasks like parenthesis matching.`,
          `B) LSTM has 4 gates (forget, input, output, cell) and 2 state vectors (hidden h and cell c): 4 x (n_in + n_hidden) weight matrices. GRU has 3 gates (reset, update, new hidden) and 1 state vector: 3 x (n_in + n_hidden) weight matrices — ~25% fewer parameters. Mathematical difference: LSTM cell state c_t = f_t*c_{t-1} + i_t*g_t (additive, like a ResNet), giving a clean gradient highway. GRU combines cell and hidden states: h_t = (1-z_t)*h_{t-1} + z_t*new_h_t — an interpolation between old and new hidden state. Practical preference: GRU is preferred for smaller datasets or compute-limited settings (fewer parameters, faster training). LSTM is preferred for longer sequences where the explicit cell state c_t's separation from the output gate may help preserve very long-range information. Empirically, performance differences are small — dataset and tuning often matter more than the choice.`,
          `C) LSTM separates short-term memory (hidden state h) from long-term memory (hidden state c) using two entirely different weight matrices. GRU collapses both into a single state vector but uses twice as many gates to compensate, making GRU more parameter-efficient for short sequences but less expressive for any task requiring distinct short-term and long-term memory simultaneously.`,
          `D) The key difference is in gradient flow: LSTM's forget gate is initialised near 0 (sigmoid(0) ≈ 0.5) and must learn to open for long-range dependencies, meaning LSTM starts with poor gradient flow that improves during training. GRU's update gate is initialised near 1, providing good gradient flow from the start — this is why GRU trains faster in early epochs and is preferred when training time is limited.`,
        ],
        answer: `B`,
      },
      {
        q: `Teacher forcing trains RNNs with ground-truth tokens as inputs, but at test time, the model uses its own predictions. What problem does this cause?`,
        options: [
          `A) Teacher forcing causes the model to become dependent on the exact token embedding values of ground-truth tokens, which have specific distributional properties (mean, variance) that differ from the model's own predicted tokens. At test time, the model's predicted embeddings have different statistical properties, causing activation distributions in the RNN hidden state to shift — a form of internal covariate shift that wasn't present during training.`,
          `B) Teacher forcing creates a slower learning signal because the model always receives correct inputs and therefore never needs to learn error recovery. The model's hidden state trajectory is always optimal (conditioned on correct history), so the model never practices the more realistic scenario of recovering from suboptimal hidden states — it learns to operate only in the narrow manifold of correct-input-conditioned hidden states.`,
          `C) Exposure bias: during training, the RNN always receives the correct previous token y_{t-1} as input. It never learns to handle its own (potentially wrong) predictions as inputs. At test time, if the model generates a wrong token at step t, it uses that wrong token as input at step t+1 — creating an error cascade (compounding errors). The model has never been trained on this error-recovery scenario and fails badly. The gap between training distribution (perfect inputs) and test distribution (self-generated inputs) is the exposure bias. Solutions: (1) Scheduled sampling — gradually replace ground-truth inputs with model predictions during training (starts with all ground-truth, ends with all model predictions). (2) Professor forcing — regularise hidden state trajectories from teacher-forced and model-forced runs to be similar. (3) REINFORCE/reward-augmented training — train with task-level rewards that are agnostic to token-level correctness. (4) Non-autoregressive models — avoid sequential generation entirely.`,
          `D) Teacher forcing prevents the model from learning the true language model probability P(x_t | x_{t-1},...,x_1) — it instead learns the conditional P(x_t | y_{t-1},...,y_1) where y are ground truth tokens. At test time the model needs the former but has only learned the latter, causing a distribution mismatch. The fix is to use maximum likelihood estimation without teacher forcing, accepting slower convergence in exchange for learning the correct conditional distribution.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `The LSTM's cell state is an additive gradient highway: when the forget gate stays near 1, the gradient flows back through hundreds of steps without shrinking — the one mechanism that vanilla RNNs lack and the reason LSTMs remain the right choice for any task where inference is sequential, real-time, and the full sequence is not available.`,
    interactiveId: 'rnn_viz',
  },
  {
    id: 'attention',
    interactiveId: 'attention_viz',
    title: 'Attention Mechanism',
    subtitle: 'Dot-product attention, multi-head attention, Q/K/V, complexity',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['attention', 'self-attention', 'multi-head attention', 'Transformer'],
    summary: `Consider the sentence "The bank by the river was steep." To translate "bank" correctly, a model needs to notice that "river" is nearby — otherwise it might pick the money-bank meaning. So the core question is: **how do you let a word look at the other words that matter to it?** That is exactly what **attention** does, and it is the single idea behind every Transformer.

The old way (encoder-decoder RNNs, circa 2014) crammed the whole sentence into one fixed-size summary vector before translation even began. By the time the model got to "bank," that summary had been overwritten word by word and the "river" clue was diluted or gone. For long sentences, this squeeze lost exactly the information that mattered.

**Attention** fixed it directly: instead of relying on one squeezed summary, let each word *reach back and look at all the other words at once*, and weight them by how relevant they are. When translating "bank," the model can put most of its weight on "river" — no matter how many words sit in between.

---

**Q, K, V — the mechanism.**

Self-attention lets *every* position look at every other position, using three learned views of each word:

- **Query (Q)** — "what am I looking for?"
- **Key (K)** — "what do I offer?"
- **Value (V)** — "what do I hand over if you pick me?"

To decide how much word *i* should attend to word *j*, you compare *i*'s query with *j*'s key (a dot product) — a big match means "this one is relevant." Run all those scores through a softmax so they become weights that add up to 1, then take the weighted average of the *values*. That is the whole operation, and it gives each word a fresh representation blended from exactly the words it cares about.

[FIGURE: attention_heatmap]

(One detail with a reason: the scores are divided by √d before the softmax. Without it, in high dimensions the dot products get so large that softmax turns nearly one-hot — a word attends to a single other word and the gradients dry up. The scaling keeps things soft enough to keep learning.)

---

**Many heads, many kinds of relationship.**

A single attention pass can only capture one *kind* of relationship at a time. So Transformers run several in parallel — **multi-head attention** — each head with its own Q/K/V views. One head might track grammatical links (verb ↔ subject), another word meaning, another position. Their outputs are combined, giving the model several different lenses on the same sentence instead of forcing everything through one.

The catch is cost: comparing every word with every other word is **O(n²)** — double the sequence length and you quadruple the work and memory. That quadratic cost is the single biggest constraint on long-context Transformers, and a whole family of tricks (FlashAttention, sparse attention, and others) exists to tame it.`,
    interactivePrompt: `Before you touch the controls: in multi-head attention with 8 heads and d_model=512, each head operates on dimension 64 — can a single head with d_model=512 represent everything 8 heads with d=64 can, and what would be lost?`,
    keyPoints: [
      `**Use self-attention when the task requires modeling relationships between any two positions in a sequence, especially when those positions are far apart.** Encoder-only (bidirectional) attention for classification and understanding tasks; causal (masked) attention for generation. For sequences longer than ~8k tokens, O(n²) memory becomes the bottleneck — use FlashAttention (exact, 2–4× faster, O(n) memory via tiling) as the first-line solution before considering approximate methods. Cross-attention applies when you need one sequence to query another — translation, image captioning, conditioning in diffusion models.`,
      `**The production trap: missing causal mask in autoregressive models.** Without masking future positions to −∞ before softmax, the model during training can attend directly to the token it is predicting — achieving near-zero training loss while learning nothing about language. The symptom is excellent training loss and near-random test generation. Always verify the causal mask is applied before the softmax, not after. Multi-head attention in decoder-only models must use upper-triangular masking for every head.`,
      `**The diagnostic: visualise attention weights on a known example before trusting any trained model.** For an encoder model, check whether the attention distribution for a given word is concentrated on related words (e.g., the subject attends to its verb) or diffuse noise. Uniform attention weights across all positions indicate the model has not learned meaningful relationships — either the query-key projections are not trained or the softmax temperature is too high. Log the entropy of attention distributions per head per layer: low entropy = head is attending specifically; high entropy = head is attending uniformly (potentially wasted capacity).`,
    ],
    takeaway: `Self-attention creates an O(1) information path between any two positions in a sequence — that is the property RNNs cannot replicate without exponential gradient attenuation, and the O(n²) memory cost is the price every efficient Transformer variant is trying to reduce.`,
    checkQuestions: [
      {
        q: `In scaled dot-product attention, why divide by √d_k? What happens without this scaling for large d_k?`,
        options: [
          `A) For n=10,000: full attention requires computing n×n = 100,000,000 attention scores. Memory: the attention matrix is n×n×4 bytes (fp32) = 400 MB per layer per head. With 16 heads and 32 layers: ~200 GB just for attention matrices — far exceeding GPU memory. FLOPs: O(n²d) per layer. Approximate approaches: (1) Sparse attention (Longformer, BigBird): compute attention only between local windows + some global tokens — O(n·k) where k is window size. (2) Linear attention: reformulate attention as a kernel approximation, achieving O(n) complexity. (3) Flash Attention: not an approximation — keeps O(n²) complexity but restructures computation to minimise GPU memory reads/writes via tiling, enabling 2-4× speedup and lower memory.`,
          `B) Dividing by √d_k normalises the dot products to have unit variance, ensuring the softmax operates at a temperature of 1. Without √d_k, the softmax temperature would be proportional to 1/√d_k, making the distribution sharper for larger d_k. A sharper distribution means the model attends too strongly to the top-scoring key, which reduces the effective batch size in the value aggregation step.`,
          `C) The √d_k scaling prevents the attention logits from having different magnitudes at different heads in multi-head attention. Without it, heads with larger d_k dimensions would have systematically larger logits than heads with smaller d_k, causing the softmax to saturate for larger heads but not smaller ones — making multi-head attention inconsistent across heads with different dimensions.`,
          `D) For query q and key k both having i.i.d. components with mean 0 and variance 1, their dot product q·k = Σᵢ qᵢkᵢ has mean 0 and variance d_k (sum of d_k unit-variance terms). Without scaling, for large d_k (e.g., d_k = 512), q·k has standard deviation √512 ≈ 22.6. The softmax is applied to these large-magnitude values: softmax([22, -15, 18, ...]) → nearly one-hot, close to 0 everywhere except the largest value. The softmax output is nearly deterministic: the attention head collapses to a hard selection rather than a soft weighting. This causes vanishing gradients through the softmax (the saturated softmax has gradients ≈ 0 for all positions). Dividing by √d_k normalises variance to 1: q·k/√d_k has std ≈ 1, keeping the softmax in a moderate-temperature regime where gradients flow.`,
        ],
        answer: `D`,
      },
      {
        q: `Multi-head attention uses h parallel attention heads, each with dimension d_k = d_model/h. Why is multi-head attention more expressive than single-head attention with dimension d_model?`,
        options: [
          `A) Multi-head attention with h heads is more expressive because it has h times more parameters than single-head attention with d_model dimension: each head has its own Q, K, V projection matrices of size d_model × d_k, and with h heads there are h such sets. The increased parameter count allows the model to represent more complex attention patterns than the single-head equivalent with its smaller parameter budget.`,
          `B) Each attention head uses different projection matrices (Wᵢ_Q, Wᵢ_K, Wᵢ_V), allowing it to attend to different aspects of the input. Head 1 might learn to attend to syntactic dependencies (verb-subject agreement), head 2 to semantic similarity (co-reference), head 3 to positional proximity, etc. A single head with d_model dimensions would need to simultaneously encode all these attention patterns in one set of attention weights — the single attention distribution cannot capture multiple different relationships at once. Multi-head: each head learns a distinct attention pattern independently, then the outputs are concatenated. This gives h different views of the same input. Ablation studies confirm: different heads specialise — removing individual heads has selective effects, confirming functional differentiation. The expressiveness gain is not from the total parameter count (which is the same as a single-head with d_model/h) but from the diversity of attention patterns.`,
          `C) Multi-head attention is more expressive because applying softmax to smaller d_k dimensions produces sharper attention distributions for each head. Sharper distributions mean each head selects fewer positions to attend to, creating a form of sparse attention. The combination of h sparse attention patterns covers more of the input space than one diffuse attention pattern over d_model dimensions.`,
          `D) Single-head attention with d_model dimensions computes QKᵀ as a single d_model×d_model outer product. Multi-head attention factorises this into h smaller d_k×d_k outer products, each with a different low-rank subspace. The factorisation provides more expressiveness because low-rank approximations to attention patterns are more regularised and generalise better than a single high-rank attention matrix.`,
        ],
        answer: `B`,
      },
      {
        q: `Attention has O(n²) complexity in sequence length n. For a 10,000-token document, what is the computational problem, and what are the main approximation approaches?`,
        options: [
          `A) For n=10,000: full attention requires computing n×n = 100,000,000 attention scores. Memory: the attention matrix is n×n×4 bytes (fp32) = 400 MB per layer per head. With 16 heads and 32 layers: ~200 GB just for attention matrices — far exceeding GPU memory. FLOPs: O(n²d) per layer = 10⁸×512 = ~5×10¹⁰ per layer. Approximate approaches: (1) Sparse attention (Longformer, BigBird): compute attention only between local windows + some global tokens — O(n·k) where k is window size. (2) Linear attention: reformulate attention as a kernel approximation, achieving O(n) complexity (Performer, Linformer). (3) Sliding window + global attention (Longformer): O(n·w) where w is window size. (4) Flash Attention: not an approximation — keeps O(n²) complexity but restructures computation to minimise GPU memory reads/writes via tiling, enabling 2-4× speedup and lower memory. (5) Retrieval-augmented / chunked attention: split document into chunks, process independently.`,
          `B) For n=10,000 with d_model=512: full attention requires 10,000×512 = 5M operations per head. The computational problem is that 512-dimensional Q and K projections make each pairwise dot product O(512) rather than O(1) — the total cost is O(n×d) not O(n²), but for large d this becomes prohibitive. Approximation approaches focus on reducing d: using lower-dimensional projections (d=64 instead of d=512) reduces the per-pair cost while keeping n×n pairs.`,
          `C) The computational problem for n=10,000 is purely a matter of sequential processing — GPU parallelism can only process b tokens simultaneously, so n=10,000 tokens requires ceil(10,000/b) sequential steps. Approximation approaches include increasing GPU batch size b (Flash Attention), using sparse representations to skip zero-attention positions (BigBird), or distilling the attention matrix into a fixed-size representation (pooling-based models).`,
          `D) For n=10,000, the O(n²) complexity means the model must process 100M token pairs, but the true bottleneck is the position embedding lookup: each of the 10,000 positions requires a unique learned embedding, and with d_model=512 this is a 10,000×512 = 5M parameter lookup table. Approximation approaches replace learned position embeddings with computed encodings (RoPE, ALiBi) to eliminate the O(n) position embedding memory.`,
        ],
        answer: `A`,
      },
    ],
    interactiveId: 'attention_viz',
    figures: {
      attention_heatmap: `<svg viewBox="0 0 340 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:340px;font-family:var(--font-sans,sans-serif)">
  <!-- tokens -->
  <g font-size="10" fill="var(--ink-mid)">
    <!-- row labels (queries) left -->
    <text x="36" y="103" text-anchor="end">The</text>
    <text x="36" y="133" text-anchor="end">cat</text>
    <text x="36" y="163" text-anchor="end">sat</text>
    <text x="36" y="193" text-anchor="end">on</text>
    <text x="36" y="223" text-anchor="end">mat</text>
    <!-- col labels (keys) top -->
    <text x="62" y="82" text-anchor="middle">The</text>
    <text x="102" y="82" text-anchor="middle">cat</text>
    <text x="142" y="82" text-anchor="middle">sat</text>
    <text x="182" y="82" text-anchor="middle">on</text>
    <text x="222" y="82" text-anchor="middle">mat</text>
  </g>
  <!-- axis labels -->
  <text x="140" y="270" text-anchor="middle" font-size="11" fill="var(--ink-low)">Key</text>
  <text x="12" y="165" text-anchor="middle" font-size="11" fill="var(--ink-low)" transform="rotate(-90,12,165)">Query</text>
  <!-- heatmap cells: each cell 40x30, starting at (42,87) -->
  <!-- row 0 (The): low attention everywhere -->
  <rect x="42" y="87" width="40" height="30" fill="var(--depth)" opacity="0.9"/>
  <rect x="82" y="87" width="40" height="30" fill="var(--prime)" opacity="0.12"/>
  <rect x="122" y="87" width="40" height="30" fill="var(--prime)" opacity="0.1"/>
  <rect x="162" y="87" width="40" height="30" fill="var(--prime)" opacity="0.08"/>
  <rect x="202" y="87" width="40" height="30" fill="var(--prime)" opacity="0.1"/>
  <!-- row 1 (cat): high on sat -->
  <rect x="42" y="117" width="40" height="30" fill="var(--prime)" opacity="0.1"/>
  <rect x="82" y="117" width="40" height="30" fill="var(--depth)" opacity="0.9"/>
  <rect x="122" y="117" width="40" height="30" fill="var(--prime)" opacity="0.6"/>
  <rect x="162" y="117" width="40" height="30" fill="var(--prime)" opacity="0.08"/>
  <rect x="202" y="117" width="40" height="30" fill="var(--prime)" opacity="0.1"/>
  <!-- row 2 (sat): high on cat -->
  <rect x="42" y="147" width="40" height="30" fill="var(--prime)" opacity="0.08"/>
  <rect x="82" y="147" width="40" height="30" fill="var(--prime)" opacity="0.5"/>
  <rect x="122" y="147" width="40" height="30" fill="var(--depth)" opacity="0.9"/>
  <rect x="162" y="147" width="40" height="30" fill="var(--prime)" opacity="0.12"/>
  <rect x="202" y="147" width="40" height="30" fill="var(--prime)" opacity="0.1"/>
  <!-- row 3 (on): medium on mat -->
  <rect x="42" y="177" width="40" height="30" fill="var(--prime)" opacity="0.08"/>
  <rect x="82" y="177" width="40" height="30" fill="var(--prime)" opacity="0.1"/>
  <rect x="122" y="177" width="40" height="30" fill="var(--prime)" opacity="0.12"/>
  <rect x="162" y="177" width="40" height="30" fill="var(--depth)" opacity="0.9"/>
  <rect x="202" y="177" width="40" height="30" fill="var(--prime)" opacity="0.35"/>
  <!-- row 4 (mat): high on on -->
  <rect x="42" y="207" width="40" height="30" fill="var(--prime)" opacity="0.08"/>
  <rect x="82" y="207" width="40" height="30" fill="var(--prime)" opacity="0.1"/>
  <rect x="122" y="207" width="40" height="30" fill="var(--prime)" opacity="0.1"/>
  <rect x="162" y="207" width="40" height="30" fill="var(--prime)" opacity="0.4"/>
  <rect x="202" y="207" width="40" height="30" fill="var(--depth)" opacity="0.9"/>
  <!-- cell borders -->
  <rect x="42" y="87" width="200" height="150" fill="none" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="82" y1="87" x2="82" y2="237" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="122" y1="87" x2="122" y2="237" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="162" y1="87" x2="162" y2="237" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="202" y1="87" x2="202" y2="237" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="42" y1="117" x2="242" y2="117" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="42" y1="147" x2="242" y2="147" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="42" y1="177" x2="242" y2="177" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="42" y1="207" x2="242" y2="207" stroke="var(--rim)" stroke-width="0.5"/>
  <!-- color bar -->
  <defs>
    <linearGradient id="cb" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="var(--depth)"/>
      <stop offset="100%" stop-color="var(--prime)"/>
    </linearGradient>
  </defs>
  <rect x="260" y="87" width="14" height="150" fill="url(#cb)" rx="2"/>
  <text x="276" y="92" font-size="9" fill="var(--ink-low)">1.0</text>
  <text x="276" y="237" font-size="9" fill="var(--ink-low)">0.0</text>
</svg>`,
    },
  },
  {
    id: 'transformers',
    title: 'Transformer Architecture',
    subtitle: 'Self-attention, positional encoding, encoder vs decoder, pre-norm vs post-norm',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['Transformer', 'architecture', 'positional encoding', 'encoder-decoder'],
    summary: `Attention has a surprising blind spot. Because it looks at all the words at once and just computes weighted averages, it does not inherently know their *order* — "the dog bit the man" and "the man bit the dog" contain the exact same words, and to raw attention they look identical. So the first thing a **Transformer** has to add is a sense of *position*.

---

**Positional encoding: telling the model where each word sits.**

The fix is to stamp each word's representation with a position signal before the first layer — a little pattern that says "I am word 1," "I am word 2," and so on. The original Transformer used sine and cosine waves of different frequencies for this (they extend smoothly to positions longer than anything seen in training); modern models like LLaMA use **RoPE**, which bakes *relative* position straight into the attention comparison. Either way, once positions are added, the model can finally tell word order apart.

---

**The Transformer block.**

Stack the pieces and you get the repeating block every Transformer is built from: normalise the inputs, run **multi-head attention** (words look at each other), add the result back through a **residual shortcut**, normalise again, run a small two-layer **feed-forward network** (FFN) on each word, and add that back too. Two details matter. The FFN is deliberately *wide* — usually 4× the model's width in the middle — because it acts as the model's *memory*, where a lot of its factual knowledge is stored; shrink it and the model measurably forgets facts. And the **residual shortcuts** are not decoration: they give the gradient a direct path back to every layer, which is the only reason you can stack dozens of these blocks without the signal dying (exactly the vanishing-gradient fix from earlier).

---

**Two flavours: encoder and decoder.**

The same block comes in two modes, set by *who is allowed to look at whom*. **Encoder-only** (BERT-style) lets every word see every other word, in both directions — great for *understanding* tasks like classification, where you want the fullest possible context. **Decoder-only** (GPT-style) masks the future, so each word can only see the words *before* it — which is exactly what you need to *generate* text one token at a time. Decoder-only models also get a training bonus: *every* token in a sequence is a prediction target at once, giving them far more learning signal per pass than BERT's "predict just the 15% we masked," which is a big part of why decoder-only models dominate at scale.`,
    interactivePrompt: `Before you touch the controls: if you remove the residual connections from a 12-layer Transformer but keep everything else identical, what would you expect to happen to the gradient norms in the first three layers?`,
    keyPoints: [
      `**Encoder-only for understanding (classification, NER, QA); decoder-only for generation (language models, chat); encoder-decoder for sequence-to-sequence tasks (translation, summarisation).** The architecture determines the training objective, which determines what the model can do. A decoder-only model cannot be directly used for tasks requiring bidirectional context (e.g., masked span filling) without changing its attention pattern. Use Pre-LN (LayerNorm before attention and FFN sub-layers) — every modern large model (LLaMA, GPT-3, PaLM) uses Pre-LN because Post-LN (original Transformer) causes gradient norms to blow up in early training and requires very careful warmup schedules to stabilise.`,
      `**The production trap: reducing d_ff below 4×d_model to cut compute.** The FFN stores factual knowledge in its weight matrices. Reducing d_ff from 4× to 2× on a large language model produces a measurable drop in downstream knowledge-intensive task performance — not just a small accuracy delta but a loss of specific factual associations the model can no longer store. Profile d_ff reduction on your specific tasks before accepting this tradeoff. The attention heads are frequently a safer target for compute reduction (fewer heads, or smaller d_k per head) without losing as much stored knowledge.`,
      `**The diagnostic: check training loss curve shape in the first 1000 steps.** A healthy Transformer training run shows a rapid initial drop followed by smooth decay. A loss spike in the first 500 steps (then recovery) is the signature of insufficient learning rate warmup — Adam's moment estimates were too noisy for the initial learning rate. A flat loss that does not decrease at all is the signature of a missing or inverted causal mask in a decoder model — the model is attending to future tokens and the prediction task is trivially solved (training loss looks low, generation is random). Both are diagnosable before committing GPU hours.`,
    ],
    takeaway: `The Transformer's power rests on three mutually dependent components: direct all-to-all attention for O(1) path length, residual connections that route gradients to every layer simultaneously, and a 4×-expanded FFN that stores and retrieves factual knowledge — each degrades measurably without the others.`,
    checkQuestions: [
      {
        q: `Why does the transformer use positional encodings, and why does standard sinusoidal encoding allow the model to generalise to longer sequences than seen in training?`,
        options: [
          `A) Transformers use positional encodings because self-attention operates on the full sequence simultaneously rather than step-by-step, so the model needs explicit position markers to distinguish sequential order. Sinusoidal encoding doesn't generalise to longer sequences better than learned embeddings — both fail at positions beyond the training maximum. The advantage of sinusoidal is that it doesn't require storing learned position embeddings in memory, saving parameters.`,
          `B) Positional encodings are needed because Transformers cannot process variable-length sequences without them — the fixed-size attention matrices require every position to have the same embedding dimension, and positional encodings provide this consistent dimensionality. Sinusoidal encoding generalises to longer sequences because higher-frequency components have short wavelengths that repeat at regular intervals, giving the model familiar sub-patterns even at unseen positions.`,
          `C) Self-attention is permutation-equivariant: swapping the order of input tokens produces outputs in the same swapped order — no positional information is inherently captured. Without positional encodings, 'The cat sat' and 'Cat the sat' would produce the same attention outputs (just reordered). Positional encodings inject position information by adding a position-dependent vector to each token embedding. Sinusoidal encoding: PE(pos, 2i) = sin(pos/10000^{2i/d_model}), PE(pos, 2i+1) = cos(pos/10000^{2i/d_model}). The sinusoidal functions generalise beyond training length because they are defined for any position — the patterns (relative positions are encoded via sin/cos addition formulas: PE(pos+k) is a linear function of PE(pos)) extrapolate smoothly. Learned positional embeddings fail at lengths beyond training because there are no learned embeddings for unseen positions. RoPE (rotary positional encoding) is now preferred: encodes relative positions directly in the attention scores, with strong length generalisation.`,
          `D) Transformers use positional encodings to compensate for the lack of recurrent connections — RNNs implicitly encode position through their sequential hidden state updates, but Transformers process all positions in parallel and therefore need explicit position information added to embeddings. Sinusoidal encoding generalises to longer sequences because the sinusoidal frequency bands are designed to match the natural frequency spectrum of language, which remains consistent regardless of sequence length.`,
        ],
        answer: `C`,
      },
      {
        q: `The feed-forward sublayer in a transformer block has two linear layers with a nonlinearity in between: FFN(x) = W₂·ReLU(W₁x + b₁) + b₂. What is the role of this sublayer, and why is its hidden dimension typically 4× the model dimension?`,
        options: [
          `A) The FFN sublayer adds position-wise nonlinear computation after the attention sublayer has mixed information across positions. Attention is fundamentally a linear operation over value vectors (the values are linearly combined by attention weights) — the FFN provides the essential nonlinearity. The FFN processes each position independently (the same W₁, W₂ are applied to each position's embedding separately). The 4× expansion (d_ff = 4×d_model, e.g., 2048 for d_model=512) creates a bottleneck architecture: project up to higher dimension (allowing the model to use more features), apply nonlinearity (ReLU or GELU), project back down. This is analogous to the 'key-value memory' interpretation: the first layer selects which 'memories' are active (sparse activation in high-dimensional space), the second layer reads out their values. Empirically, the 4× ratio is robust across model scales from BERT to GPT-3.`,
          `B) The FFN sublayer provides cross-position communication: unlike attention which only computes weighted sums of values, the FFN can mix information between positions through its matrix multiplications. The 4× expansion is needed because cross-position mixing requires a high-dimensional intermediate space to avoid information bottlenecks — reducing d_ff below 4× forces the model to use attention exclusively for cross-position mixing, which is less efficient.`,
          `C) The FFN sublayer acts as a content-addressable memory that stores factual associations learned during pre-training. The 4× expansion specifically encodes this factual capacity: the 4× ratio was empirically determined to provide enough neurons (~4×512 = 2048 in BERT-base) to store the most important factual associations in the pre-training corpus, with each neuron specialising in one concept or entity.`,
          `D) The FFN sublayer normalises the attention output to prevent the attention mechanism from producing representations with unbounded magnitude. Without the FFN's compression back to d_model dimensions, attention outputs would grow in magnitude with sequence length (due to summing over more values). The 4× expansion allows the compression to be non-linear, giving the model flexibility in how it normalises across different sequence lengths.`,
        ],
        answer: `A`,
      },
      {
        q: `Why does training a transformer require a learning rate warmup, and what happens without it?`,
        options: [
          `A) Learning rate warmup is needed because transformer weights are initialised with values distributed around zero (Xavier/He initialisation). Full learning rate from step 1 causes the first gradient steps to overshoot the optimal initialisation point, scrambling the carefully balanced initialisation before the model has seen enough data to correct. Warmup allows the model to take small steps that preserve the initialisation properties that make transformers trainable at depth.`,
          `B) Warmup is required because the transformer's residual connections create a gradient magnitude imbalance at initialisation — layers close to the loss receive full gradient magnitude, while early layers receive near-zero gradient due to residual summation. Full learning rate from step 1 causes the late layers to diverge while early layers barely update. Warmup gradually increases the rate to let early layers accumulate sufficient gradient history before large updates are applied.`,
          `C) Warmup prevents the transformer's positional encodings from being overwritten in early training. At step 1, positional encoding values are the largest signals in the first-layer input (random weights produce near-zero outputs), so full learning rate immediately updates the embedding layer to suppress positional information. Gradual warmup allows the model to learn to use positional encodings before the gradient updates are large enough to change the embedding layer significantly.`,
          `D) Without warmup, at step t=1 with Adam: the second moment v₁ is nearly zero (v₁ = (1−β2)·g₁² with β2=0.999, so v₁ = 0.001·g₁²). The bias-corrected denominator √(v₁/(1−β2^1)) = |g₁| is fine. But the problem is that early gradients in transformer layers can have very different scales — embedding layers may have large gradients, attention layers small gradients. With a full learning rate immediately applied, the optimizer takes full-sized steps (α=1e-4) when the second moment estimates are noisy and unreliable (based on only 1-2 batches of history). This causes early parameter updates to be in potentially bad directions (the gradient direction is unstable with sparse, high-variance early batches). Warmup linearly increases α from near-zero over 2000-4000 steps, allowing the Adam moments to accumulate enough history (achieve lower variance) before large updates are applied. Without warmup, transformers often diverge in the first hundred steps.`,
        ],
        answer: `D`,
      },
    ],
  },
  {
    id: 'pretraining',
    title: 'Pre-training & Transfer Learning',
    subtitle: 'Masked LM, causal LM, BERT vs GPT objectives, feature extraction vs fine-tuning',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['pre-training', 'transfer learning', 'BERT', 'GPT', 'fine-tuning'],
    summary: `You have 500 labelled radiology reports and need to classify them by findings. Train a model from scratch on those 500, and it has to learn *everything* at once — what "pulmonary" means, that "nodule" is worrying, that "no evidence of" flips the meaning, *and* the actual classification rule — all from 500 examples. It ends up memorising quirks that do not generalise, and test AUC lands at a dismal **0.61.**

Now do one thing differently: start from **PubMedBERT**, a model already trained on 14 million medical papers, and fine-tune it on the *same* 500 reports. Test AUC: **0.87.** Nothing about your labels or task changed. What changed is the *starting point* — PubMedBERT already knows medical language, so your 500 labels only have to teach it the final decision, not the entire vocabulary. This is **transfer learning**, and it is one of the highest-leverage ideas in modern ML.

---

**What pre-training actually does.**

Pre-training is *self-supervised*: you take a mountain of unlabelled text and make the model play fill-in-the-blank or predict-the-next-word, billions of times. To get good at that game, the model is forced to internalise how language works — grammar, vocabulary, which words go together, domain structure — and all of that gets baked into its weights, landing it in a *region of parameter space* that already "understands" the language. Fine-tuning then just nudges it a short distance from there to solve your specific task. You are not teaching from scratch; you are giving directions from a place that is already most of the way there.

---

**Two pre-training styles, two strengths.**

The *game* you make the model play shapes what it becomes. **Masked language modelling** (BERT) hides about 15% of the words and asks the model to fill them in using context on *both* sides — which produces rich, full-context representations, ideal for *understanding* tasks. **Causal language modelling** (GPT) predicts each next word from only the words *before* it — which is denser training (every token is a target) and lines up naturally with *generating* text. That is why understanding tasks lean on BERT-style models and generation leans on GPT-style ones.

---

**The one danger: forgetting what it knew.**

Fine-tuning has a trap called **catastrophic forgetting**: hit the pre-trained model with a big learning rate on your small dataset and you *overwrite* the very knowledge that made it valuable, collapsing it onto your narrow task. The standard safety recipe is a *gentle* touch — a learning rate 10–100× smaller than pre-training used, only a few epochs, a short warmup, and a little weight decay — small enough steps that you *stay near* the pre-trained starting point instead of wandering off and erasing it.`,
    keyPoints: [
      `**For any NLP or vision task with fewer than 10K labeled examples, start from a pretrained model — the few-shot gains are 20–50 AUC points in specialized domains.**\n\nThe 500-example radiology case is not unusual. Medical NLP, legal document classification, scientific literature tagging — all have small labeled datasets and large unlabeled corpora. Domain-matched pretraining (PubMedBERT for biomedical, LegalBERT for contracts) outperforms general BERT by an additional 5–15 points when the domain vocabulary diverges significantly from web text.`,
      `**Trap: catastrophic forgetting — fine-tuning with a high learning rate on a small dataset overwrites pretrained representations. Use a warmup schedule, a learning rate 10–100× smaller than the original pretraining LR, and weight decay.**\n\nBERT's original pretraining used LR = 1e-4. Fine-tuning at that same rate for 5 epochs on 500 examples destroys the pretrained representations: the model converges to a local minimum defined entirely by the narrow task distribution. The standard recipe: LR = 2e-5, 3–5 epochs, linear warmup over the first 10% of steps, weight decay 0.01. This keeps the parameter updates small enough that the pretrained basin is not abandoned.`,
      `**Diagnostic: if validation loss diverges immediately after fine-tuning starts, the LR is too high. If it never improves past random baseline, the task head is misspecified or the pretrained model is mismatched to the domain.**\n\nTwo distinct failure modes look superficially similar (poor validation accuracy) but have opposite causes. Immediate divergence: the first gradient step is too large, destroying the pretrained initialization — reduce LR by 10×. No improvement at all: the pretrained model's representation space does not have a basis for the target task — the domain gap is too large (e.g., using a general English BERT for Chinese clinical text), or the output head projects to the wrong dimension or uses the wrong activation for the task type.`,
    ],
    interactivePrompt: `Before you touch the controls: if PubMedBERT was pretrained on medical text and you fine-tune it on legal contracts with 500 examples, would you expect the same 26-point AUC gain as the radiology example — and what would change if the target domain were further from the pretraining domain?`,
    checkQuestions: [
      {
        q: `BERT masks 15% of tokens and predicts them. Why 15% and not 50% or 1%? Explain the tradeoff.`,
        options: [
          `A) 15% is the theoretical optimum from information theory: masking 15% of tokens in a sequence of length 512 produces exactly 76.8 masked tokens, which matches the vocabulary size of ~30,000 tokens at the ratio required for balanced learning across all tokens. Masking fewer tokens undershoots this ratio and leads to unbalanced vocabulary learning; masking more tokens overshoots it and leads to prediction targets that are too frequent per epoch.`,
          `B) The 15% rate balances two competing concerns: prediction signal density vs. context quality. Too low (1%): the model sees only ~1 masked token per 100-token sequence. Most of the forward pass provides no prediction signal, wasting compute. The model trains very slowly. Too high (50%): half the sequence is masked — the model has lost so much context that predicting masked tokens is nearly impossible (too little signal in the remaining tokens). The model learns to predict from very partial context, which diverges from the full-context understanding needed for downstream tasks. 15% empirical optimum: most of the sequence is visible as context (85%), providing rich signal, while 15% of tokens provide training signal. Additionally, BERT uses the 80/10/10 split within the 15%: 80% replaced with [MASK], 10% replaced with random token, 10% kept unchanged — this prevents the model from learning that [MASK] is special and ensuring the encoder also represents unmasked tokens well.`,
          `C) The 15% mask rate was chosen to match the typical proportion of unknown words (out-of-vocabulary tokens) that a model encounters in real-world text. By masking 15% of tokens — approximately the rate of OOV tokens in early NLP benchmarks — BERT learns to handle unknown token positions robustly, which transfers directly to downstream tasks involving specialized vocabulary.`,
          `D) 15% masking ensures each training example provides exactly one masked token prediction on average for shorter sequences (under 100 tokens), because 15% of 100 = 15 positions with 15 probability ≈ 1 guaranteed prediction target. This one-prediction-per-example property was empirically found to provide the most stable training signal and is why 15% became standard rather than other values.`,
        ],
        answer: `B`,
      },
      {
        q: `GPT is trained with causal (autoregressive) language modelling, BERT with masked language modelling. Which is better for generation, and why can't you use BERT for generation directly?`,
        options: [
          `A) BERT is actually better for generation in most practical settings because its bidirectional context produces higher-quality token representations — BERT "knows" what comes after each token, so it can generate tokens that fit better within the full surrounding context. The limitation is that BERT generates all tokens simultaneously rather than sequentially, requiring iterative refinement through multiple mask-and-predict passes to produce coherent text.`,
          `B) Both GPT and BERT can be used for generation, but GPT produces left-to-right text more naturally. BERT can generate text by iteratively masking and predicting tokens from right to left, which produces grammatically correct output but with a different stylistic character than left-to-right generation. The choice between them depends on whether right-to-left or left-to-right generation better suits the downstream task.`,
          `C) Neither model can generate text without supervised fine-tuning on (prompt, response) pairs — pre-trained language models only learn to continue text statistically, not to generate coherent responses to prompts. GPT is typically fine-tuned for generation because its autoregressive training is more directly analogous to the generation task, but the pre-trained model itself does not generate text in any meaningful sense.`,
          `D) GPT (autoregressive) is better for generation because it is trained to predict each next token given only prior tokens — exactly the structure needed for generation: P(x_t | x_1,...,x_{t-1}). At generation time, the model autoregressively samples tokens one at a time, each conditioned on all previously generated tokens. BERT cannot do this directly because: (1) BERT uses bidirectional attention — every token attends to all others, including future tokens. At generation time, future tokens don't exist yet, so BERT cannot condition on them. (2) BERT is trained to fill in [MASK] tokens, not to predict the next token — it has no mechanism for the sequential left-to-right prediction needed for autoregressive generation. Using BERT for generation would require masked prediction at each position (inefficient and ill-defined for open-ended generation). BERT's bidirectional context makes it better for understanding/classification tasks; GPT's causal attention makes it naturally generative.`,
        ],
        answer: `D`,
      },
      {
        q: `What is catastrophic forgetting in neural networks, and why does it make sequential fine-tuning on multiple tasks difficult?`,
        options: [
          `A) Catastrophic forgetting refers to the loss of gradient information during very long training runs — after many thousands of steps, the optimizer's momentum and second moment estimates diverge from the current gradient direction, causing the network to "forget" which direction improves the loss. Sequential fine-tuning across multiple tasks compounds this because each task resets the optimizer state, creating multiple cycles of gradient forgetting.`,
          `B) Catastrophic forgetting occurs when the network's weight magnitudes become too large during training — large weights saturate activation functions (sigmoid, tanh) and make the network insensitive to new inputs. Sequential fine-tuning is difficult because each new task increases weight magnitudes further, progressively degrading the network's ability to distinguish between inputs for all previously learned tasks.`,
          `C) Catastrophic forgetting: when a network is sequentially trained on task B after task A, the weights updated for task B overwrite the weights that encoded task A knowledge. The network 'forgets' task A because SGD moves weights to minimise task B's loss without constraint, and the updated weights are no longer optimal for task A. This happens because: (1) Neural network weights are shared across tasks — there is no isolated 'task A module.' (2) Gradient descent on task B loss pushes weights in directions that may increase task A loss. (3) Task A training data is not available during task B training (the forgotten loss surface). This makes sequential fine-tuning problematic: fine-tuning a pre-trained LLM on a new task may improve new-task performance but degrade the model's language modeling quality and other capabilities. Mitigations: replay (mix old task data into new task training), elastic weight consolidation (EWC — penalise changes to weights important for task A), multi-task learning (train on all tasks simultaneously).`,
          `D) Catastrophic forgetting is a memory management problem in hardware: GPU memory used by task A's optimizer states is overwritten by task B's training process. The solution is to use task-isolated memory allocation (separate CUDA streams per task), ensuring each task's weight updates are staged in task-specific memory regions before being applied to the shared model weights.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Pre-training changes the optimization starting point, not just the weight scale — it places the model in a loss basin near representations that generalize, which is why 500 fine-tuning examples produce a 26-point AUC gain that no amount of regularization from random initialization can replicate.`,
  },
  {
    id: 'finetune',
    title: 'Fine-Tuning Strategies',
    subtitle: 'Full fine-tune, LoRA, prefix tuning, adapter layers — when each applies',
    difficulty: 'advanced',
    estimatedMin: 29,
    tags: ['fine-tuning', 'LoRA', 'PEFT', 'adapters', 'LLM'],
    summary: `You want LLaMA-2 70B to answer internal questions in your company's tone and format. The brute-force way — **full fine-tuning** — means updating *all 70 billion* weights. Just the bookkeeping (weights, gradients, and Adam's two running averages) needs roughly 14 bytes per parameter — about **980 GB** of GPU memory, a dozen top-end GPUs, days of training, and a real risk of overwriting the very abilities that made the model good. For most teams that is a non-starter. The good news: you almost never need to move all 70 billion weights.

---

**LoRA: train a tiny add-on, freeze the rest.**

The key insight behind **LoRA** is that the *change* a model needs to adapt to a new task is small and simple — it lives in a low-dimensional space. So instead of learning a full 4096×4096 update matrix (16.7 million numbers), LoRA learns it as the product of two skinny matrices — say 4096×8 and 8×4096 — just about **65,000** numbers, a 99.6% cut. The giant base model stays *frozen*; only these two little matrices train. And the elegant part: once trained, the tiny update can be *added straight back* into the original weights, so the deployed model is exactly the same size and speed as the original — **zero extra inference cost.** That mergeability is LoRA's edge over "adapter" approaches that bolt on permanent extra modules.

---

**QLoRA: fit a 70B fine-tune on a single GPU.**

**QLoRA** pushes this further so 70B fine-tuning fits on *one* 80GB GPU. The trick: squash the frozen base model down to 4-bit numbers (from ~140GB to ~35GB), and train the small LoRA matrices in full precision on top. Because the base weights are never actually updated — all the learning happens in the little adapters — the rounding error from the 4-bit squashing barely matters. The result is near-full-fine-tuning quality at a tiny fraction of the hardware.

---

**One distinction worth nailing down.**

People sometimes call "train a fresh classifier on top of a frozen model" *fine-tuning* — it is not, it is **feature extraction**, and it can only *re-sort* the representations the model already has. True fine-tuning (including LoRA) actually changes the model's effective weights, which is what lets it learn genuinely new behaviour — a new tone, a new format, a new skill. If you need the model to *do* something new, you need real fine-tuning; if you only need to classify what it already understands, feature extraction is enough.`,
    keyPoints: [
      `**Start with LoRA for any fine-tuning task — it matches full fine-tuning quality in most cases with 10–100× less compute and no catastrophic forgetting risk. Use rank 8–16 for most tasks, rank 64+ only if you need to teach genuinely new knowledge.**\n\nFor teaching a new response format, tone, or domain-specific behavior that the pretrained model already has partial knowledge of, rank 8–16 captures the adaptation signal. For teaching a model new facts it was not exposed to in pretraining — new entities, new languages, new structured formats — higher rank or full fine-tuning is necessary. Start low and increase rank only if validation performance plateaus.`,
      `**Trap: fine-tuning on fewer than 1K examples with a low learning rate often gives no improvement over the base model — the signal is too weak. Either collect more data, use a stronger learning rate with warmup, or use prompt engineering instead.**\n\nLoRA with rank 8 has ~65K trainable parameters for a single 4096×4096 matrix. With 500 training examples, the signal-to-noise ratio for those parameters is marginal. If validation performance is flat after 3 epochs, the problem is data volume, not architecture. LoRA at rank 16 on 500 examples is not materially different from prompt engineering — both are adapting a powerful pretrained model with very thin signal.`,
      `**Diagnostic: monitor training loss AND a held-out prompt that captures the target behavior. If training loss decreases but the target behavior does not improve, the fine-tuning data does not actually demonstrate the target behavior.**\n\nThis is the most common fine-tuning failure: the training data measures something correlated with but not identical to what you want. If you want the model to always respond in bullet points, your training data must contain bullet-point responses — training loss on paragraph responses will decrease without producing the format change. Log the target-behavior metric (format compliance, accuracy on held-out examples, human evaluation scores) separately from training loss throughout the run.`,
    ],
    interactivePrompt: `Before you touch the controls: at rank 8 on a 4096×4096 attention matrix, LoRA uses 65K parameters — what fraction of the full matrix update does that represent, and at what rank would LoRA become effectively equivalent to full fine-tuning?`,
    checkQuestions: [
      {
        q: `You fine-tune a pre-trained BERT model on a sentiment classification task with 500 labeled examples. What are the risks, and what techniques do you use?`,
        options: [
          `A) Risks with 500 examples: (1) Catastrophic forgetting — large updates to all BERT weights for a small-data task destroy the pre-trained representations. (2) Overfitting — BERT has 110M parameters, 500 examples is far too few to train from scratch; even fine-tuning all layers risks memorising. Techniques: (1) Freeze early layers — only fine-tune the last 2-3 transformer layers and the classification head. The early layers encode syntactic/lexical features that transfer well; only task-specific features need updating. (2) Use a small learning rate (1e-5 or 2e-5 for pre-trained layers, up to 1e-3 for the fresh classification head). (3) Few-epoch training — 3-5 epochs maximum with early stopping on validation. (4) Prompt-tuning or adapter layers — add a small trainable module while freezing all BERT weights entirely. Adapter parameters: ~0.1% of full model, dramatically reducing forgetting and overfitting risk. (5) Data augmentation: back-translation, synonym replacement to expand 500 → ~2000 effective examples.`,
          `B) The primary risk with 500 examples is underfitting — BERT needs at least 10,000 fine-tuning examples per class to adapt its representations away from general language modeling toward task-specific classification. With only 500 examples, the model will memorise training data perfectly (high training accuracy) but fail at the classification task conceptually (low validation accuracy). The technique is to use a much higher learning rate (1e-3) to force the model to adapt aggressively from the limited data.`,
          `C) With 500 examples and BERT's 110M parameters, the ratio (220,000 parameters per example) makes full fine-tuning ideal rather than risky — high parameter-to-example ratios actually help because the model can use its full capacity to represent each training example precisely, and BERT's pre-trained representations prevent the model from learning random noise. The main risk is underfitting if you use too small a learning rate.`,
          `D) The main risk is catastrophic forgetting of the classification head weights, not the pre-trained BERT layers. The 500 examples are sufficient to maintain the pre-trained BERT representations (which are robust to small-scale updates), but the randomly initialised classification head may diverge if trained with the same learning rate as BERT. Technique: use a higher learning rate for the BERT layers (1e-3) and a lower rate for the classification head (1e-5).`,
        ],
        answer: `A`,
      },
      {
        q: `LoRA (Low-Rank Adaptation) decomposes weight updates into low-rank matrices: ΔW = BA where B ∈ ℝ^{d×r} and A ∈ ℝ^{r×k}. For d=k=1024 and r=8, how many parameters does LoRA add vs full fine-tuning? Why does this work?`,
        options: [
          `A) LoRA adds more parameters than implied by the rank: B is 1024×8 = 8,192 parameters; A is 8×1024 = 8,192 parameters; but LoRA also requires gradient tracking for all base model weights during training to compute the correct gradients for A and B — effectively requiring the same memory as full fine-tuning during training, with savings only at inference when BA is merged.`,
          `B) LoRA saves parameters by updating only the attention layers: with 12 attention layers and 4 matrices per layer (Q, K, V, O), LoRA updates 12 × 4 × 16,384 = 786,432 parameters vs 12 × 4 × 1,048,576 = 50,331,648 for full attention fine-tuning. The efficiency comes from targeting only attention matrices, not from the low-rank factorisation — full-rank updates to the FFN layers are still required.`,
          `C) Full fine-tuning: 1024×1024 = 1,048,576 additional parameters per weight matrix. LoRA: B is 1024×8 = 8,192 parameters; A is 8×1024 = 8,192 parameters; total 16,384 per weight matrix — 64× fewer parameters than full fine-tuning. Why it works: the hypothesis is that the relevant weight update ΔW lies in a low-dimensional subspace of the full parameter space. Empirically, fine-tuning updates to large pre-trained models have low intrinsic dimensionality — most of the useful adaptation can be captured with r=8 or r=16 rank components, even for large matrices. Additionally: A is initialised with random Gaussian, B with zeros (so ΔW=BA=0 initially — the pre-trained model is unchanged at the start of fine-tuning). During training, only A and B are updated while the frozen W provides the baseline representation. At inference: W' = W + BA is materialised for no latency overhead.`,
          `D) Full fine-tuning: 1024×1024 = 1,048,576 parameters. LoRA: B is 1024×8 = 8,192 parameters; A is 8×1024 = 8,192 parameters; total 16,384 — a 64× reduction. But LoRA doesn't actually work via low intrinsic rank: the BA product always produces a full-rank update when A and B have independent random initialisations, so rank-8 LoRA can theoretically represent any full-rank update. The real reason LoRA works is implicit regularisation — the product BA introduces a regularisation bias equivalent to nuclear norm minimisation, which prevents overfitting on small datasets.`,
        ],
        answer: `C`,
      },
      {
        q: `When does RLHF (Reinforcement Learning from Human Feedback) improve a language model beyond standard fine-tuning? What is the reward model, and what can go wrong?`,
        options: [
          `A) RLHF improves over SFT when the task has a clear correctness signal (code execution, math verification) — in these cases, the reward model is replaced by an automated verifier, and RLHF's PPO training allows the model to explore solution strategies beyond those in the SFT dataset. For subjective tasks like helpfulness, RLHF actually underperforms SFT because human preference data is too noisy to learn reliable rewards. What can go wrong: verifier hacking, where models game the automated checker without solving the underlying problem.`,
          `B) RLHF improves over SFT (supervised fine-tuning) when: (1) Human preferences are hard to encode as a loss function directly — 'helpfulness' and 'harmlessness' cannot be easily reduced to next-token cross-entropy. (2) The model needs to generate responses that maximise a global property of the output (e.g., overall helpfulness), not just fit the distribution of training examples. SFT on demonstrations may not capture the distinction between good and mediocre outputs. The reward model: a separate model trained on human preference comparisons — given (prompt, response_A, response_B), humans rate which is better. The reward model learns to score responses. RLHF: use PPO (proximal policy optimization) to update the LLM to generate responses with high reward model scores. What can go wrong: (1) Reward hacking — the LLM finds ways to get high reward model scores without being genuinely helpful (long, verbose responses that look helpful; sycophantic agreement; confident-sounding incorrect answers). (2) The reward model itself is imperfect and can be gamed. (3) Over-optimisation — too much RL training collapses diversity. (4) KL penalty prevents too much divergence from the SFT model.`,
          `C) RLHF improves over SFT only when the model is large enough (>7B parameters) — smaller models don't benefit because their reward model fails to learn human preferences accurately from limited comparison data. The reward model for smaller RLHF applications is typically a logistic regression classifier on top of frozen embeddings, which provides insufficient signal for the PPO policy updates to make meaningful improvements over the SFT baseline.`,
          `D) RLHF and SFT are equivalent in expectation — both optimise the same objective (match human-preferred outputs) with the same training data (human demonstrations or comparisons). RLHF's advantage is purely computational: PPO processes preference data more efficiently than cross-entropy on demonstration data, requiring 10× less human annotation for the same downstream performance. What can go wrong: PPO's clipping parameter requires careful tuning or the policy diverges.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Task-specific weight updates have low intrinsic rank — LoRA exploits this to fine-tune a 70B model with 0.2% of its parameters, and because BA merges directly into W after training, the deployed model is byte-for-byte identical to the base model with zero inference overhead.`,
  },
  {
    id: 'quantization',
    title: 'Quantisation & Model Efficiency',
    subtitle: 'INT8 vs FP16, quantisation-aware training vs PTQ, calibration, accuracy tradeoff',
    difficulty: 'advanced',
    estimatedMin: 29,
    tags: ['quantisation', 'INT8', 'model compression', 'efficiency'],
    summary: `A trained model stores every weight as a float32 number — 4 bytes each. GPT-2's 117 million weights take 468 MB just sitting there. On a phone, that is often too big to load and too slow to run. The obvious question: do we really need 4 bytes of precision per weight, or can we get away with less?

We can get away with a lot less. Store each weight as an 8-bit integer instead — 1 byte — and the file shrinks 4× to 117 MB. Better still, most CPUs have special hardware for 8-bit integer math (the same circuitry that makes video and audio codecs fast), so the model also runs **2–4× faster.** For a phone, that is often the difference between "can't run this" and "runs smoothly."

---

**How do you turn a float into an 8-bit integer?**

An 8-bit integer can only be one of 256 values. So you take the actual range of the weights — say [−0.5, 0.5] — and chop it into 256 evenly spaced buckets. Each weight is rounded to its nearest bucket: \`x_int = round(x_float / scale)\`, where \`scale = (max − min) / 255\`. Two nearby floats that land in the same bucket become the same integer. That rounding is the price you pay — a small error per weight.

The catch is *outliers.* If 99.9% of weights sit in [−0.5, 0.5] but one weight is 5.0, the range must stretch to cover it — and now your 256 buckets are spread across a huge span, wasting almost all of them and leaving the common weights with almost no precision. Handling outliers well is the whole game in quantization.

---

**The key move: calibrate on real data.**

Weights are fixed after training, so their range is known exactly. But *activations* — the numbers flowing between layers — change with every input, and you can't know their range in advance. So you *calibrate*: run 100–1000 real, representative inputs through the model, watch the actual activation ranges at each layer, and set the scale factors from what you see. This is **post-training quantization (PTQ)** — no retraining, done in minutes. With good calibration, INT8 typically loses **under 1% accuracy.** Skip calibration — guess the ranges instead of measuring them — and accuracy collapses silently, with no error in the logs. That silent failure is the single most common quantization mistake.

---

**When PTQ isn't enough.**

Push down to 4-bit and PTQ starts dropping 2–5% accuracy — too many weights crammed into too few buckets. Two fixes. Smarter PTQ (GPTQ, AWQ) protects the weights that matter most and nudges the rest to compensate for rounding, reaching 4-bit at under 1% loss. Or **quantization-aware training (QAT):** simulate the rounding *during* training so the model learns to place its weights where they round cleanly. QAT recovers the most accuracy but costs a full retraining run — so you reach for it only when 4-bit-and-below quality is critical.`,
    keyPoints: [
      `**Apply INT8 PTQ to every model before production deployment — it is 2–4× faster on CPU, 4× smaller in memory, and nearly free accuracy-wise with proper calibration. ONNX Runtime or TensorRT handles this in a few lines.**\n\nThe two-line version in ONNX Runtime: \`quantize_dynamic(model_path, output_path, weight_type=QuantType.QInt8)\`. The full version with static calibration: provide a calibration dataset and use \`quantize_static\`. The static version consistently outperforms dynamic quantization by 0.3–0.8% accuracy because it calibrates activation ranges, not just weight ranges.`,
      `**Trap: quantizing without a calibration set causes severe accuracy loss — the scale factors are wrong. Always run calibration on 100–1000 representative examples from your deployment distribution, not random noise.**\n\nThe scale factor must cover the actual activation value range at inference. If calibration is done on random inputs (or skipped), the scale factors are computed from a distribution that does not match deployment. Activations get clipped to the scale range, producing large quantization errors that look like random noise in predictions. The model will have low average accuracy with no error or warning in the serving logs.`,
      `**Diagnostic: per-layer quantization error — if one layer shows much higher reconstruction error than others, that layer has outlier activations. Apply mixed-precision (keep that layer in fp16) before resorting to QAT.**\n\nQuantization frameworks expose per-layer error metrics. A single layer whose int8 reconstruction differs from float32 by more than 2% of the output range is an outlier layer. Mixed-precision keeps that one layer in fp16 while quantizing everything else to int8, recovering most of the accuracy at a small memory cost. This is almost always cheaper than running a full QAT retraining run.`,
    ],
    interactivePrompt: `Before you touch the controls: if a weight layer has a value range of [-0.01, 0.01] but one outlier weight is 5.0, how does that outlier affect the int8 scale factor and the precision available for the other 99.9% of weights?`,
    checkQuestions: [
      {
        q: `INT8 quantization reduces a weight from float32 (32 bits) to int8 (8 bits). What is the compression ratio, and what information is lost?`,
        options: [
          `A) PTQ: quantize after training is complete. No additional training required — load the trained model, apply quantization (compute scale factors from a small calibration dataset, 100-1000 samples). Fast and easy, but accuracy may degrade for aggressive quantization (INT4 or below). Typical accuracy: FP32→INT8 PTQ on ResNet-50: <0.5% top-1 accuracy drop. FP32→INT4 PTQ: 1-3% drop. QAT: insert fake quantization nodes during training — the forward pass uses quantized values (rounding to INT8), the backward pass uses straight-through estimator (STE) to pass gradients through the non-differentiable rounding. The model learns to use weight values that round well to INT8. More training required (fine-tuning for 10-30% of original training schedule), but accuracy is much closer to float32. Typical: QAT INT4 ≈ PTQ INT8 accuracy. Use PTQ when: fast deployment, INT8 is the target, accuracy drop is acceptable. Use QAT when: INT4 or lower is needed, accuracy is critical, training infrastructure is available.`,
          `B) Compression ratio: 32/8 = 4× reduction in memory. Information lost: dynamic range. A float32 weight can represent values across 23 bits of mantissa precision, but the critical information lost in INT8 is the exponent range — INT8 can represent values from -128 to 127, while float32 can represent values up to ~3.4×10³⁸. Any weight larger than 127 in absolute value is clipped to the INT8 maximum, causing large quantization errors for weights with high magnitude regardless of their distribution.`,
          `C) Compression ratio: 32/8 = 4× reduction in memory. But the effective compression is smaller in practice because INT8 requires storing scale factors (float32) alongside the quantized weights — one scale factor per layer adds ~4 bytes per weight matrix, reducing effective compression to ~3.7× for typical layer sizes. The information lost is primarily in the gradient computation during backward passes, which is why INT8 is only used for inference, not training.`,
          `D) Compression ratio: 32/8 = 4× reduction in memory. Information lost: precision. A float32 weight can represent values across ~7.2 significant decimal digits and a wide dynamic range (exponent allows values from ~10⁻⁴⁵ to ~10³⁸). INT8 can represent only 256 distinct values in the range [w_min, w_max] with step size (w_max−w_min)/255. For a weight range of [−0.5, 0.5], the quantization step is ~0.004 — any weight value is rounded to the nearest 0.004 increment. Weights with magnitude < 0.001 (tiny weights) are rounded to 0 and zeroed out. The quantization error is the difference between the original float32 weight and its INT8 representation — this error propagates through inference as output noise. The key insight: if the weight distribution is not too wide and outliers are rare, INT8 precision is sufficient for inference accuracy close to float32.`,
        ],
        answer: `D`,
      },
      {
        q: `Post-training quantization (PTQ) vs quantization-aware training (QAT): when do you use each, and what is the typical accuracy difference?`,
        options: [
          `A) PTQ: quantize after training is complete. No additional training required — load the trained model, apply quantization (compute scale factors from a small calibration dataset, 100-1000 samples). Fast and easy, but accuracy may degrade for aggressive quantization (INT4 or below). Typical accuracy: FP32→INT8 PTQ on ResNet-50: <0.5% top-1 accuracy drop. FP32→INT4 PTQ: 1-3% drop. QAT: insert fake quantization nodes during training — the forward pass uses quantized values (rounding to INT8), the backward pass uses straight-through estimator (STE) to pass gradients through the non-differentiable rounding. The model learns to use weight values that round well to INT8. More training required (fine-tuning for 10-30% of original training schedule), but accuracy is much closer to float32. Typical: QAT INT4 ≈ PTQ INT8 accuracy. Use PTQ when: fast deployment, INT8 is the target, accuracy drop is acceptable. Use QAT when: INT4 or lower is needed, accuracy is critical, training infrastructure is available.`,
          `B) PTQ and QAT produce identical accuracy at INT8 because INT8 has sufficient precision (256 levels) that rounding errors are below the model's noise floor. The choice between them is purely practical: PTQ takes minutes, QAT takes days. The accuracy difference only becomes relevant at INT4 or INT2, where QAT's gradient-guided weight adjustment is needed to maintain model performance.`,
          `C) PTQ is always preferred over QAT because QAT's fake quantization introduces a training-inference discrepancy: the straight-through estimator used for backward passes is an approximation that biases the gradient, causing the model to converge to a slightly different weight configuration than the non-quantized model. PTQ avoids this bias by quantizing after convergence, producing weights that are true quantizations of the fully trained float32 weights.`,
          `D) QAT is always preferred over PTQ regardless of the target bit width — QAT recovers 2-5% accuracy at INT8, not just INT4. The reason PTQ is used despite QAT's accuracy advantage is that QAT requires modifying the training code to insert fake quantization nodes, which creates engineering complexity. PTQ is a deployment step that requires no changes to the training infrastructure.`,
        ],
        answer: `A`,
      },
      {
        q: `Why are activations harder to quantize than weights in a neural network?`,
        options: [
          `A) Activations are harder to quantize because they are computed in sequence during the forward pass — each layer's activations depend on the previous layer's quantized activations, causing quantization errors to compound through the network. Weight quantization errors don't compound because all weights are applied independently in parallel during matrix multiplication, so errors average out rather than accumulating.`,
          `B) Weights are fixed after training — their distribution is known precisely and static. We can compute the exact min/max range of each weight tensor once and set scale/zero-point accordingly. Activations are dynamic — they change for every input sample. The activation distribution depends on the input, and we cannot precompute the exact range for all possible inputs. Outlier activations (very large or very small values occurring rarely) force the quantization range to be wide, wasting bits on the large range while losing precision in the common range. In transformers, attention logits can have very large outliers (especially in later layers of large models) that make INT8 quantization of activations much harder than weight quantization. Solutions: (1) Histogram-based calibration — use a representative dataset to estimate the 99th percentile range and clip outliers. (2) Per-tensor vs per-token quantization — quantize each token's activation separately for its own scale factor. (3) SmoothQuant — mathematically migrate the quantization difficulty from activations to weights (which are easier to quantize).`,
          `C) Activations are harder to quantize because they have higher dimensionality than weights — a hidden layer with 4096 units produces 4096-dimensional activation vectors, whereas the corresponding weight matrix is only 4096×4096 scalars. Higher-dimensional tensors require more scale factors, and computing scale factors for high-dimensional activations is computationally expensive compared to the simpler per-channel weight scale factors.`,
          `D) Activations use floating-point operations (floating-point multiplications for nonlinear activations like ReLU and GELU) that cannot be represented exactly in integer formats. Weights are applied through matrix multiplication, which can be exactly replicated in integer arithmetic. The fundamental incompatibility between activation functions and integer arithmetic makes activation quantization an approximation, while weight quantization is exact.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Quantization is a calibration problem: the scale factors that map float ranges to integers are only valid for the distribution they were calibrated on — skip calibration or shift the production distribution and the accuracy drop will be silent, with no error and no obvious cause.`,
  },
  {
    id: 'dl_serving',
    title: 'DL Model Serving',
    subtitle: 'Batching, model parallelism, TorchScript/ONNX, GPU memory, latency SLAs',
    difficulty: 'advanced',
    estimatedMin: 29,
    tags: ['model serving', 'ONNX', 'TorchScript', 'GPU', 'latency'],
    summary: `You put a GPT-2 model behind an API. The obvious way to serve it: take one request, run it, return the answer, take the next. Each forward pass takes 50ms, so you get 20 requests per second. But watch the GPU while this happens — it is 95% idle. A GPU is a machine built to do thousands of multiplications at once, and you are feeding it one request at a time. It is a delivery truck making one trip per parcel.

So fill the truck. Stack 32 requests together and run them in a single forward pass. Because the GPU was mostly empty, those 32 finish in roughly the same 50ms as one did — **640 requests per second from the exact same hardware, no model change at all.** Batching is the first and biggest lever in serving.

---

**Dynamic batching: don't wait forever for a full truck.**

Waiting for exactly 32 requests is bad if traffic is slow — early requests sit around. The production fix is *dynamic batching:* set a small deadline, say 5ms, and run whatever has arrived by then. Ten requests? Batch the ten. Forty? Take a batch and queue the rest. You capture most of the batching gain while keeping the wait bounded. Every serving framework (vLLM, TGI, ONNX Runtime) does this with one config flag.

---

**Generation has a second problem batching can't fix.**

When an LLM writes a reply one token at a time, producing token number *t* means paying attention to all *t−1* tokens before it. Do this naively and every new token re-computes the attention for every earlier token — the total work grows like n², so a long reply gets punishingly slow near the end.

The fix is the **KV cache.** The first time you process a token, you compute its attention "key" and "value" and *save them.* Every later token just reuses the saved keys and values instead of recomputing them — the work drops from n² to n. For a 512-token reply that is roughly a 512× cut in attention compute. The cost is memory: those saved tensors pile up with every token and every concurrent user. For LLaMA-7B a single token's cache is ~524 KB, so a 512-token chat holds ~256 MB — and an 80 GB A100 (model already loaded) fits only ~300 such chats before it has to start queuing. This is why long context is expensive: the cache, not the weights, runs you out of memory.

---

**Speculative decoding: guess ahead, verify in bulk.**

One more trick for generation speed. Let a small, fast "draft" model guess the next K tokens, then have the big model check all K *in one forward pass* — which costs about the same as generating a single token. When the draft guessed right, you got K tokens for the price of one; typical speedups are 2–3×. The whole theme of serving: the bottleneck is almost never raw model size — it is how well you keep the GPU full through batching, caching, and quantization.`,
    keyPoints: [
      `**Implement dynamic batching before any other optimization — it is the single highest-leverage change for throughput, often 10–30× improvement with zero accuracy cost.**\n\nThe math is simple: at batch size 1, GPU utilization on a typical LLM inference workload is 5–15%. At batch size 32, it is 60–80%. Matrix multiply FLOP/byte ratio scales with the batch dimension — larger batches use the GPU's memory bandwidth more efficiently. Every serving framework (vLLM, TGI, ONNX Runtime) implements dynamic batching; enabling it takes one configuration flag.`,
      `**Trap: KV cache grows linearly with sequence length — at long context (16K+ tokens), KV cache can exceed model weight memory. Set max_sequence_length based on actual P99 request lengths, not the theoretical maximum.**\n\nFor LLaMA-7B with 16K context: KV cache per request = 524KB/token × 16,384 tokens = 8.3GB. On an 80GB A100 with ~60GB available after model weights, that supports 7 concurrent requests at 16K context — versus 200+ at 512 tokens. Profile your actual P99 sequence length from traffic logs before configuring context limits. Allowing 16K context for a workload whose P99 is 1K wastes 16× the KV memory.`,
      `**Diagnostic: profile GPU utilization during serving. If under 60%, you are under-batching. If over 95% with high latency, you have over-batched or the model is too large for your SLA — consider quantization or a smaller model.**\n\nNVIDIA's \`nvidia-smi dmon\` gives per-second GPU utilization. Under-batching (low utilization) and over-batching (high utilization, high latency) have opposite fixes. The target operating point is 70–85% utilization at your P99 latency budget. Below that: increase max batch size or reduce batch timeout. Above that: add more GPUs, quantize to reduce per-request compute, or use a smaller model.`,
    ],
    interactivePrompt: `Before you touch the controls: if generating a 100-token response without KV cache requires computing the full attention matrix at each of the 100 steps, how does the total attention compute compare to the same generation with KV cache enabled?`,
    checkQuestions: [
      {
        q: `A transformer model has 175B parameters in FP16. How much GPU memory is required for model weights alone? How many A100 80GB GPUs do you need?`,
        options: [
          `A) KV cache stores key and value tensors from previous tokens to avoid recomputation during autoregressive generation. Without KV-cache: generating token t requires attention over tokens 1,...,t. For each new token, we recompute keys and values for all t-1 previous tokens — O(t) compute per token, O(t²) total for a sequence of length t. With KV-cache: at each step, only compute K, V for the new token and append to the cache. Per-step compute is O(1) (just the new token's Q, and attention over cached KV). Total compute: O(t) instead of O(t²). Memory cost: GPT-3 has 96 layers, 96 attention heads, d_head = 128. Per token, KV cache stores: 2 × 96 × 96 × 128 × 2 bytes ≈ 4.5 MB per token. For 1000 tokens: 4.5 GB per sequence.`,
          `B) 175B parameters × 2 bytes/parameter (FP16) = 350 billion bytes = 350 GB just for weights. But FP16 requires storing both the weights and their FP32 master copies for precision, so the actual memory requirement is 350 GB × 1.5 = 525 GB. For weights only: ceil(525/80) = 7 GPUs minimum. In practice, 8 A100 80GB GPUs are required for the standard tensor-parallel configuration.`,
          `C) 175B parameters × 2 bytes/parameter (FP16) = 350 billion bytes = 350 GB just for weights. One A100 80GB has 80 GB — cannot fit the model alone. For weights only: ceil(350/80) = 5 GPUs. But inference also requires activations, KV cache, and intermediate buffers. The KV cache for generating a batch of 32 sequences of length 2048 with 96 layers and d_model=12288: 2 × batch × seq_len × n_layers × d_model × 2 bytes = 2 × 32 × 2048 × 96 × 12288 × 2 ≈ 300 GB. Total: ~650 GB for weights + KV cache ≈ 9 A100s for 175B inference. In practice, minimum deployment configurations use 8× A100 80GB for FP16 (Megatron tensor parallelism) or 4× A100 with INT8 quantization (350 GB → 175 GB weights).`,
          `D) 175B parameters × 2 bytes/parameter (FP16) = 350 GB. But tensor-parallel sharding across GPUs requires 2× overhead for communication buffers (sending activations between GPUs during all-reduce operations). So effective memory per GPU = 350 GB × 2 / n_GPUs. For n=8 GPUs: 700 GB / 8 = 87.5 GB per GPU — marginally over the 80 GB limit. Minimum 16 GPUs are needed for FP16 inference with tensor parallelism.`,
        ],
        answer: `C`,
      },
      {
        q: `Batching requests increases GPU utilization but increases latency. How does dynamic batching work, and what is the p99 latency problem?`,
        options: [
          `A) Dynamic batching groups requests by output length — requests expected to generate similar numbers of tokens are batched together. This eliminates the static batching problem where short requests wait for long ones to finish. The p99 latency problem disappears because all batch members complete at approximately the same time. The tradeoff is that length prediction is imperfect, so dynamic batching introduces occasional mispredictions that still cause occasional long waits.`,
          `B) Dynamic batching works by pre-allocating a fixed batch size (e.g., B=32) and padding shorter requests with zeros until the batch is full. The GPU is always processing exactly B requests simultaneously. The p99 latency problem occurs because padding wastes GPU computation on zero-valued tokens — requests at the 99th percentile pay a disproportionate compute cost because they require more padding to align with the longest request in their batch.`,
          `C) Dynamic batching requires knowing each request's output length before processing, which is impossible for generative models. Instead, dynamic batching groups requests by input length — requests with similar input lengths are batched together to minimise attention mask padding. The p99 latency problem arises because input-length-sorted batching creates systematic queuing: very short requests queue behind many similar-length requests rather than being processed immediately.`,
          `D) Dynamic batching: instead of processing each request immediately (batch size 1), the serving system waits for a short time window (e.g., 10ms) and collects all requests that arrive in that window into a batch, processing them together. GPU utilization is higher because matrix multiplications on larger batches are more hardware-efficient (better FLOP/byte ratio). Latency tradeoff: a request that arrives alone must wait 10ms for the window before processing starts — adding fixed latency. Average latency may be acceptable, but p99 (99th percentile) latency suffers: an unlucky request might wait up to window_size ms just for batching, then the actual generation time is longer for a larger batch. The p99 problem: SLA contracts are often defined at p99 or p95, not mean. A system with mean latency 100ms might have p99=500ms if 1% of requests are delayed by batching waits. Solution: adaptive batch size limits (cap batch size at B_max based on current load), or continuous batching (new requests join mid-generation, dramatically improving utilization without fixed wait windows).`,
        ],
        answer: `D`,
      },
      {
        q: `KV-cache stores key and value tensors from previous tokens to avoid recomputation during autoregressive generation. How does it save computation, and what is its memory cost for GPT-3 (175B) generating a sequence of length 1000?`,
        options: [
          `A) Without KV-cache: generating token t requires attention over tokens 1,...,t. For each new token, we recompute keys and values for all t-1 previous tokens — O(t) compute per token, O(t²) total for a sequence of length t. With KV-cache: at each step, only compute K, V for the new token and append to the cache. Retrieve all previous K, V from cache. Attention computation uses these cached values. Per-step compute is O(1) (just the new token's Q, and attention over cached KV). Total compute: O(t) instead of O(t²). Memory cost: GPT-3 has 96 layers, 96 attention heads, d_head = 128. Per token, KV cache stores: 2 (K and V) × 96 (layers) × 96 (heads) × 128 (d_head) × 2 bytes (FP16) = 4,718,592 bytes ≈ 4.5 MB per token. For 1000 tokens: 4.5 GB per sequence. For a batch of 10 sequences: 45 GB — already comparable to the model's weight memory. KV-cache is the dominant memory cost in transformer serving.`,
          `B) KV-cache saves computation by avoiding the softmax recomputation for previous tokens — without cache, the full softmax over all previous keys is recomputed at each step. With cache, only the new key is added to the existing distribution using an incremental softmax update. Memory cost: GPT-3's KV cache is 2 × 175B_params × 2_bytes × (seq_len / model_dim) ≈ 0.35 TB × (1000 / 12288) ≈ 28 GB per sequence, requiring 4× A100 80GB GPUs just for the KV cache of a single 1000-token sequence.`,
          `C) KV-cache eliminates the need to store intermediate attention matrices during generation — without cache, the full attention matrix (seq_len × seq_len × n_heads) must be recomputed from scratch at each step. With cache, only the attention scores for the new token need to be computed. Memory cost: the attention matrix for 1000 tokens with 96 heads = 1000 × 1000 × 96 × 4 bytes = 384 MB per sequence — much smaller than weight memory and not a bottleneck.`,
          `D) KV-cache trades computation for memory: instead of recomputing Q, K, V projections at each generation step (O(d²) per step), the cache stores precomputed projections (O(seq_len × d) memory). The computation savings are 3× (K and V are cached; only Q must be recomputed). Memory cost for GPT-3: 2 vectors × d_model × n_layers × seq_len × 2 bytes = 2 × 12288 × 96 × 1000 × 2 = 4.7 GB per sequence — comparable to KV-only cache calculations since d_head × n_heads = d_model.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Throughput and latency are opposing objectives — batching 32 requests gives 32× throughput but adds queuing time, and KV cache gives 512× compute reduction for generation but consumes memory that limits concurrency — optimize for one explicitly before touching model size or architecture.`,
  },
  {
    id: 'dl_debugging',
    title: 'DL Training Failure Modes',
    subtitle: 'Loss spikes, NaN gradients, mode collapse, underfitting vs overfitting — debugging',
    difficulty: 'advanced',
    estimatedMin: 29,
    tags: ['debugging', 'training failures', 'NaN gradients', 'mode collapse'],
    summary: `You start training a new model and the loss just sits there — stuck at log(number of classes), epoch after epoch. The natural instinct is to start turning knobs: a different learning rate, a bigger model, more data. Resist it. Before asking "why won't it learn what I want," ask the more basic question: *can this model learn anything at all?* Almost every training bug is easier to catch by answering that first.

---

**Step 1: overfit a single batch.**

Take one batch. Turn off all regularization. Train on just that one batch for a thousand steps. A working model *must* be able to memorize a handful of examples — the loss should crash to near-zero. If it can't even do that, no hyperparameter will save you; the model is wired wrong. Usual suspects: the loss doesn't match the output (softmax paired with MSE, or cross-entropy fed raw logits), the output layer has the wrong number of classes, the labels are the wrong shape, or a forward-pass bug is zeroing activations. This test takes 60 seconds and rules out every one of those at once. It is the single most valuable habit in debugging deep nets.

---

**Step 2: if that passes but full training won't converge, look at gradient flow.**

The signal is learning, but maybe it isn't reaching every layer. Log the average gradient size for each layer after a step. In a healthy network the biggest and smallest layer gradients stay within ~10× of each other. See 10,000× instead and the early layers are getting almost nothing — **vanishing gradients** — and they will not learn no matter how long you train; the fix is ReLU, residual connections, or better initialization, not more epochs. The reverse — early layers with huge gradients — is **exploding gradients:** clip them (max_norm=1.0) and check your initialization.

---

**A quick lookup for the classic failures.**

Loss frozen at log(K): the model is outputting uniform probabilities — the output layer isn't connected or the loss is wrong. Loss suddenly NaN at step t: gradients were blowing up in the steps just before, the learning rate is too high, or a log(0) crept into cross-entropy (add a tiny ε to the softmax). Training loss falling but validation flat: train and validation don't come from the same distribution, or a threshold hasn't been tuned.

---

**And the trap that fools everyone: a falling loss does not mean it's working.** Loss can drop steadily while the model learns nothing useful. On an imbalanced dataset, a model that always predicts the majority class hits 95% accuracy and a nicely decreasing loss curve — and is completely useless. So look past the curve: eyeball a few actual predictions, check the confusion matrix (is it just always guessing one class?), and check that gradient norms sit in a sane range (~0.001–10).`,
    keyPoints: [
      `**Always start debugging by overfitting a single batch — if loss does not reach near-zero on 1 example, the model is fundamentally misconfigured before any data issue can matter.**\n\nReduce to 1 batch, remove all regularization (dropout, weight decay), train for 1,000 steps. Loss should converge to near-zero. If it does not, the model has a bug — wrong output activation, wrong loss function, dimension mismatch, or a broken forward pass. This test costs 60 seconds and rules out all configuration bugs before you touch hyperparameters.`,
      `**Trap: tuning hyperparameters before running sanity checks. A model with a bug can have decreasing loss but be completely wrong — never tune until the single-batch overfit test passes.**\n\nA cross-entropy loss with softmax output decreasing from 2.3 to 1.8 over 10 epochs looks like progress. It is not, if the model has an off-by-one label error and is learning to predict the class one index above the correct class everywhere. The single-batch overfit test catches this: the model will overfit the single example to near-zero loss, but inspection of the prediction will show the wrong class label being predicted with high confidence.`,
      `**Diagnostic: gradient norm logging catches 80% of training bugs — if any layer's gradient norm is 0 or greater than 100, you have found the problem layer. Add a single hook at the start of training, not after the model is already broken.**\n\nIn PyTorch: \`param.register_hook(lambda g: print(g.abs().mean()))\` on each layer, or use a unified hook that logs per-layer norms to a dictionary. Run it for the first 10 steps. Norm of 0 on a layer: dead neurons (ReLU killing all activations), wrong weight initialization, or a missing gradient path. Norm above 100: exploding gradients, clip with \`torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\`. Both are fixable in minutes once localized to the specific layer.`,
    ],
    interactivePrompt: `Before you touch the controls: if a model starts training with loss at log(10) = 2.3 and that value does not change over 100 steps, what are the three most likely root causes — and which one does the single-batch overfit test rule out first?`,
    checkQuestions: [
      {
        q: `Training loss is NaN after step 47. List your debugging steps in order, and what is the most common cause in transformer training?`,
        options: [
          `A) NaN loss after step 47 means the batch at step 47 triggered the failure. The only debugging step needed is: identify that exact batch (save the random seed, reproduce step 47), inspect it for outlier values, and remove it from the training set. Most NaN losses in transformer training are caused by corrupted data batches containing infinity or missing values, not architectural or hyperparameter issues.`,
          `B) Debugging order: (1) Reduce learning rate by 10× — most common cause of NaN in transformer training is a bad gradient update exploding weights. If NaN disappears, LR was too high. (2) Check for NaN in inputs — if data preprocessing produces NaN (e.g., log(0), division by zero), the loss will be NaN immediately. Add a nan_check assertion on the batch before the forward pass. (3) Enable gradient clipping (max_norm=1.0) — large gradients, not the learning rate itself, cause weight explosions. (4) Check for numerical instability in custom loss functions — log(0) or 0/0 in the loss computation. Add epsilon: log(x+1e-8). (5) Reduce batch size — smaller batches sometimes expose NaN-producing edge cases that rare inputs cause. (6) Use FP32 for the loss computation even if the model uses FP16 (mixed precision) — FP16 overflows at ~65504, easy to overflow with large logit values. Most common cause in transformer training: FP16 overflow in attention softmax when logits are not scaled by √d_k, or exploding gradients in early training without warmup.`,
          `C) NaN loss always propagates backward from the final layer. Start debugging by checking the output layer: verify the loss function is compatible with the output activation (e.g., log-softmax loss requires softmax output, not raw logits). If the output layer is correct, add a NaN check after each layer in order from output to input — the first layer that produces NaN is the root cause. Most common cause: incompatible loss-activation combination in the output layer.`,
          `D) The debugging order for NaN loss is irrelevant because NaN always results from the same cause: division by zero in the normalisation layers. Add epsilon=1e-7 to every denominator in every LayerNorm, BatchNorm, and attention computation in the transformer. This single fix resolves all NaN losses in transformer training; any remaining issues after this fix are data problems, not architectural ones.`,
        ],
        answer: `B`,
      },
      {
        q: `Your model achieves 99% training accuracy but 51% test accuracy (near-random for binary classification). What is happening, and what are the top 3 most likely causes?`,
        options: [
          `A) 99% training accuracy with 51% test accuracy indicates the model has converged to a degenerate solution — it has learned to output one class for all inputs. This happens when the model architecture is too deep and residual connections allow the model to trivially learn the identity function. The top 3 causes: (1) too many residual layers, (2) identity initialisation that persists, (3) loss function that rewards predicting the majority class.`,
          `B) This gap indicates the model has memorised the training set's class-conditional feature means rather than discriminative features. Top 3 causes: (1) mean features are not discriminative (the two classes have overlapping means), (2) model has no regularisation and has fit to the exact means rather than decision boundaries, (3) validation set has different feature means than training — distribution shift in the first and second moments.`,
          `C) This 99/51% gap indicates severe overfitting or data leakage. The 3 most likely causes in order of probability: (1) Target leakage — a feature in the training data directly encodes the label (e.g., 'previous outcome' field, a row ID correlated with label ordering, a timestamp that identifies which class comes from which time period). The model perfectly memorises the leaky feature during training; this feature behaves differently or is absent at test time. Investigate: train a 1-feature model for each feature individually — any feature achieving near-100% training accuracy alone is leaking. (2) Train/test distribution shift — training data and test data come from different distributions (e.g., training on 2019 data, testing on 2023 data with different feature relationships). The model memorises the 2019 distribution perfectly but does not generalise to 2023. (3) Data preprocessing leakage — scaling, encoding, or imputation applied to the full dataset before splitting, using test-set statistics during training. Correct procedure: fit all preprocessing on train only, apply to test.`,
          `D) 99% training accuracy with 51% test accuracy (near chance) means the model is predicting the majority class for all test examples — a class imbalance problem. The training set has 99% of one class, so the model achieves 99% training accuracy by always predicting that class. The test set happens to be balanced (50/50), making always-predicting-one-class achieve ~50% test accuracy. Fix: apply class-balanced sampling during training or use a weighted loss function.`,
        ],
        answer: `C`,
      },
      {
        q: `Validation loss oscillates rather than decreasing monotonically. You're using SGD+momentum with lr=0.01 and batch size 64. List three possible causes and fixes.`,
        options: [
          `A) (1) Learning rate too high — the optimizer overshoots the loss minimum, bouncing between two nearby loss values. Fix: reduce lr by 2-5×, or add a learning rate schedule (cosine decay, ReduceLROnPlateau). Monitor training loss — if it also oscillates, LR is the culprit. If training loss decreases monotonically but validation oscillates, the cause is (2). (2) Validation set too small — with few validation examples, the validation loss estimate has high variance; random fluctuations in validation batches appear as oscillations. Fix: increase validation set size if possible, or use k-fold CV. Report the moving average of validation loss rather than step-by-step values. (3) Momentum too high — β=0.9 or β=0.99 causes the optimizer to overshoot in the high-curvature directions of the loss landscape, creating bouncing behavior. Fix: reduce β to 0.85 or 0.8. Also check: is the model changing significantly between evaluations (evaluation frequency is too high relative to training speed)? Report validation loss every epoch rather than every 100 steps.`,
          `B) Validation loss oscillation with monotonically decreasing training loss always indicates overfitting, not an optimization problem. The three causes are always variations of the same root: (1) insufficient regularisation, (2) model too large for dataset size, (3) missing data augmentation. Fix all three simultaneously: add dropout p=0.3, add weight decay λ=0.01, add random horizontal flips and crops. Optimization parameters (lr, momentum) do not cause validation loss oscillation if training loss is decreasing smoothly.`,
          `C) Oscillation means the model is alternating between two different parameter configurations on each epoch. This is a momentum artifact: with β=0.9, SGD remembers 90% of the previous gradient direction, causing the optimizer to alternate between two nearby gradient directions if the loss landscape has symmetric saddle points. Fix: use Adam instead of SGD+momentum — Adam's adaptive learning rates prevent the symmetric oscillation that momentum causes on saddle-point-dominated loss landscapes.`,
          `D) Validation loss oscillation at batch size 64 is caused by the correlation between batch selection and validation performance: with 64-sample batches, each batch represents 1/n of the training data, and some batches happen to contain examples that are very similar to the validation set, temporarily improving validation performance. Fix: use stratified batch sampling to ensure each batch has the same class distribution as the overall dataset, eliminating the spurious validation fluctuations caused by non-representative batches.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Overfit one batch first, then log gradient norms per layer — these two tests diagnose 80% of training failures in minutes, before touching hyperparameters or architecture, because a model that cannot learn one example has a bug, not a tuning problem.`,
  },
]
