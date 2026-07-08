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
    recap: [
      `**XOR = the whole game:** plot the four cases and no single straight line separates the 1s (exactly-one-on) from the 0s (both-on / both-off) — they sit on opposite diagonals. This is a structural limit of a linear model, not a data or tuning problem, and every problem a network solves is deep down this same "the input can't be split as-is" problem.`,
      `**One hidden layer is the fix:** slip in a layer of non-linear neurons and the network can bend, fold, and curve the boundary — it *transforms* the input into a new space where a straight line finally separates the classes. That reshaping is exactly what every hidden layer in every network is doing.`,
      `**Universal approximation theorem:** one hidden layer with enough neurons can approximate *any* continuous function arbitrarily well. The catch: "enough" can be astronomically many (exponential in the inputs), whereas a second layer represents the same function with far fewer neurons — so depth is about *efficiency*, not reachability.`,
      `**Depth buys efficiency, not free accuracy:** the theorem only says a good solution *exists* at depth — it says nothing about whether gradient descent will *find* it. A careless deep net can starve its early layers of gradient and simply not learn, which is why activations, normalisation, and residual connections exist: to make depth *trainable*.`,
      `**Verify capacity-limited before adding depth:** the common mistake is stacking layers when training loss stalls. First hook the backward pass and log per-layer gradient norms — a 1000:1 ratio between last-layer and first-layer norms means the early layers get no signal and the depth is already wasted; more layers make it worse. Fix gradient flow (ReLU, residuals, better init) before going deeper.`,
      `**Diagnostic — overfit one batch:** before any hyperparameter search, train on a single mini-batch with no regularisation; a correct model should crash to near-zero loss in 100–200 steps. If it can't, the architecture, loss function, or output activation is wrong — this rules out implementation bugs before you waste hours tuning a broken model.`,
    ],
    checkQuestions: [
      {
        q: `A fully connected layer with 512 inputs and 256 outputs has how many parameters? What is the forward pass computation?`,
        options: [
          `A) W is 512×256 (input×output convention) with bias 512×1: total 131,072+512=131,584 parameters. Forward pass: z = Wx+b treats x as a 256-dim vector, which is inconsistent with the stated 512-dim input shape.`,
          `B) W is 256×512, but the layer also needs a separate normalisation sub-layer with its own 512 learned parameters: total 131,072+512=131,584. Forward pass inserts normalisation between the linear map and the activation.`,
          `C) Biases are omitted because batch normalisation makes them redundant, so parameters = 256×512 = 131,072 only. Forward pass: z = normalize(Wx), a = σ(z), with no bias term added at any stage of the computation.`,
          `D) W is 256×512 (output×input) → 131,072 weights; bias 256×1 → 256. Total 131,328. Forward: z = Wx+b (256×1), a=σ(z). Batched over n samples: Z = WX+b, cost O(256×512×n).`,
        ],
        answer: `D`,
      },
      {
        q: `Universal approximation theorem says a neural network can approximate any continuous function. Why doesn't this guarantee good generalisation?`,
        options: [
          `A) Universal approximation applies only to sigmoid networks; ReLU networks are restricted to piecewise-linear functions, so the theorem's guarantee never extends to modern ReLU-based deep networks at all.`,
          `B) It's an existence theorem: a wide-enough network can represent any continuous function, but nothing guarantees gradient descent finds or needs that exact function from finite, noisy data.`,
          `C) The theorem guarantees the global optimum is reachable only for convex losses; since network loss is non-convex, gradient descent always converges to a local minimum unrelated to the true function.`,
          `D) The theorem only holds in the limit of infinite width, so finite real networks provide no approximation guarantee whatsoever, regardless of how many neurons, layers, or training epochs are actually used.`,
        ],
        answer: `B`,
      },
      {
        q: `Two hidden layers with 64 units each vs one hidden layer with 4096 units, roughly matched in parameter count — which TWO statements about image recognition are correct?`,
        options: [
          `A) Depth lets the network build a hierarchy — edges → textures → parts → objects — composing simple features into complex ones across layers, which a single wide layer cannot do by construction.`,
          `B) A single very wide layer maps input pixels to 4096 units directly with no hierarchical composition, so it can't reuse simple features to build complex ones the way stacked layers do.`,
          `C) The universal approximation theorem guarantees both architectures reach identical validation accuracy whenever parameter counts match, since expressiveness depends only on total parameter count.`,
          `D) Wide single layers implicitly learn pooling-like spatial invariances, matching deep networks' inductive bias for images while keeping simpler gradient flow through fewer layer transitions.`,
        ],
        answer: ['A', 'B'],
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
    summary: `You have a network with a hundred million weights, and one training example. Running it forward to get a prediction is fast. But now you need to nudge *every one* of those hundred million weights in the right direction to make the prediction better.

Pause here: how would you compute the gradient for just **one** of those hundred million weights, without re-running the whole network? The naive idea is exactly what it sounds like — tweak that weight a hair, re-run the whole forward pass, see if the loss dropped, put it back, move on. That costs a full forward pass *per weight*. A hundred million forward passes for a single training step. At that price, deep networks would be untrainable, and for decades people were not sure they could be trained at all.

**Backpropagation** is the trick that makes it cheap. The key realisation: the forward pass already computed everything you need to work out *all* the gradients — you just have to reuse those cached values, walking backward through the network. One forward pass, one backward pass, and you have the gradient for every weight at once, no matter how many there are.

---

**Watch it work (the network above).**

Feed it x₁ = 1.0, x₂ = 0.5, with a hidden layer of two ReLU units (W₁ = [[0.5, −0.3], [0.2, 0.8]], b₁ = [0.1, −0.1]) and a sigmoid output (W₂ = [0.7, −0.5], b₂ = 0), against a target of 1.0. Forward: the hidden layer computes z₁ = [0.45, 0.5] — both positive, so ReLU passes both through unchanged to a₁ = [0.45, 0.5] — the output layer computes z₂ = 0.065, and sigmoid squashes that to a prediction of about 0.516. Against a target of 1.0, the loss comes out to about 0.234.

Now go backward. Picture the gradient as a message passed down through the floors of a building: the loss sits on the top floor and hands instructions to W₂ first, one floor down, then further down to W₁, one more floor below. Pause and predict before reading on: which of the two ends up with the *smaller* gradient — W₂, right next to the output, or W₁, one extra handoff away — and why?

Walk the chain rule backward and the answer is a little surprising: W₂'s gradient averages about −0.115, and W₁'s about −0.109 — almost the *same size*, despite the extra hop. Look at what's sitting on that hidden floor: **ReLU**, whose slope is a clean 1 for every active neuron. The message passed down that floor essentially untouched. The one hop that *did* cost something was the output floor's **sigmoid** — its slope there was about 0.25, and that's the only toll the whole backward trip paid.

---

**Why deep networks stalled: vanishing gradients.**

Now imagine that hidden floor had been sigmoid instead of ReLU. It would have charged the same toll the output floor just did — about 0.25 — and tolls *compound*. A sigmoid's slope is *at most* 0.25, and usually less. Multiply that in at every handoff, and after 10 sigmoid floors the message reaching the first layer is scaled by roughly 0.25¹⁰ — about one in a million; after 20, essentially zero. The instructions sent from the top floor arrive at the bottom as silence. The early layers get no signal and never learn, so your "20-layer network" quietly behaves like a 2-layer one. That's exactly what the ReLU floor above avoided — its slope of 1 charges no toll at all, which is why swapping sigmoid hidden layers for **ReLU** is the fix. (ReLU's own catch is the *dead neuron* — one whose input is always negative outputs zero forever, dropping out of the relay; Leaky ReLU and GELU keep a trickle of gradient flowing to prevent that.)

The mirror-image failure is **exploding gradients**, common in recurrent networks that multiply the same weights over and over: if that factor is even slightly above 1, the message doesn't shrink to zero — it blows up to NaN instead. The fix is **gradient clipping** — if the gradient's overall size exceeds a cap, scale it back down while keeping its direction. And **residual connections** fix vanishing structurally: add a shortcut (output = layer + input) so the message gets a direct path back that skips the shrinking handoffs entirely, which is why ResNets train hundreds of layers deep.

---

**One practical cost: memory.**

Because the backward pass reuses the forward pass's intermediate values, they all have to be *stored* until the backward pass runs — which for a big model is a lot of memory. **Gradient checkpointing** is the standard trade: keep only a few of those intermediates and recompute the rest on the fly during the backward pass, spending about 30% extra compute for **O(√depth)** memory. It is what lets large models train on limited GPUs. (And for the curious: backprop is often called "just the chain rule," but the magic is applying it in *reverse* order — that reverse direction is exactly what makes the whole thing cost one forward pass instead of one-per-parameter.)

ReLU stops the message from shrinking on the way down — but it trades one failure for another, the dead neuron. Working out exactly when a neuron dies, and how Leaky ReLU and GELU keep the relay alive, is where the next module, Activation Functions, picks up.`,
    interactivePrompt: `Before you touch the controls: if the forward pass computes the loss, why does the backward pass need to store intermediate activations from the forward pass rather than just the final loss value?`,
    keyPoints: [
      `**When your network has more than one layer and you need to update weights end-to-end.** That is always. Backprop is the only practical algorithm for computing exact gradients in deep networks. You do not implement it yourself — every modern framework (PyTorch, JAX, TensorFlow) runs it automatically. What you do need to understand: the forward pass must cache intermediate activations, gradient checkpointing trades 30% extra compute for O(√depth) memory (mandatory for large models on limited GPU), and the gradient accumulates by summation when multiple paths lead to the same node.`,
      `**The production trap: ignoring gradient norms.** Backprop produces the correct gradient mathematically, but "correct" can be a gradient of 10⁻¹² — numerically zero. Early layers in deep sigmoid networks receive no learning signal, and training proceeds as if those layers do not exist. Always log gradient norms per layer during the first training run. A ratio of 1000:1 between last-layer and first-layer norms means the depth is wasted. The fix is ReLU activations or residual connections, not more data or a different learning rate.`,
      `**The diagnostic: verify gradient flow before anything else.** Register a backward hook on each layer and log the mean absolute gradient at each step. For a 10-layer network with healthy gradient flow, the norms should decay by at most ~10× from output to input — not 10⁶×. If you see exponential decay, the activation function is saturating. If you see exponential growth, gradient clipping (max_norm=1.0) is missing. Both symptoms are visible before the first epoch completes.`,
    ],
    takeaway: `Backprop computes every parameter gradient in roughly one forward pass by caching intermediates and applying the chain rule in reverse — without caching, each gradient would cost a separate forward pass, making large-scale training impossible.`,
    recap: [
      `**Naive gradient = one forward pass per weight:** tweak a weight, re-run the whole forward pass, see if loss dropped, repeat — with 100M weights that's 100M forward passes for a *single* training step. At that price deep nets are untrainable, which is why for decades people doubted they could be trained at all.`,
      `**Backprop = one forward + one backward pass total:** the forward pass already computed everything the gradients need, so you cache those intermediate values and walk backward once, recovering the gradient for *every* weight at once — no matter how many there are.`,
      `**The chain rule in reverse is the magic:** backprop is "just the chain rule," but applying it in *reverse* order (output back to input) is what collapses the cost to one pass instead of one-per-parameter. Gradients also *sum* when multiple paths reach the same node.`,
      `**Vanishing gradients:** a sigmoid's slope is at most 0.25, multiplied in at every layer → ~0.25¹⁰ ≈ one-in-a-million after 10 layers, essentially zero after 20. Early layers get no signal and never learn, so a "20-layer net" behaves like a 2-layer one. Fix: ReLU (slope 1 for active neurons) and residual connections (a shortcut that skips the shrinking multiplications).`,
      `**Exploding gradients:** the mirror failure — common in RNNs that multiply the same weights repeatedly. If the factor is even slightly above 1, the gradient blows up to NaN. Fix: gradient clipping — if the gradient's overall size exceeds a cap, scale it back down while keeping its direction.`,
      `**Memory cost:** because the backward pass reuses the forward pass's intermediate activations, they must all be *stored* until it runs — a lot of memory for a big model. Gradient checkpointing keeps only a few and recomputes the rest on the fly: ~30% extra compute for O(√depth) memory, which is what lets large models train on limited GPUs.`,
      `**Diagnostic — log per-layer gradient norms on the first run:** a healthy 10-layer network's norms decay by at most ~10× from output to input. A 10⁶× (1000:1+) ratio means the activation is saturating and the depth is wasted; exponential *growth* means clipping (max_norm=1.0) is missing. Both are visible before the first epoch finishes.`,
    ],
    checkQuestions: [
      {
        q: `Derive the gradient of the loss with respect to the bias in a single hidden layer: L = (σ(wx + b) - y)². Compute ∂L/∂b step by step. Select the TWO correct statements about this derivation.`,
        options: [
          `A) By the chain rule, ∂L/∂b = ∂L/∂h · ∂h/∂a · ∂a/∂b where ∂L/∂h = 2(h-y), ∂h/∂a = σ(a)(1-σ(a)), and ∂a/∂b = 1, giving ∂L/∂b = 2(h-y)·h(1-h).`,
          `B) ∂L/∂b equals the backpropagated error δ = 2(h-y)·h(1-h) multiplied by the Jacobian of the pre-activation with respect to b, which is exactly 1 since a = wx + b.`,
          `C) ∂L/∂b = 2(h-y)·h(1-h)·w, because b and w share the same coefficient in a = wx+b, so the bias gradient always equals the weight gradient scaled by the weight itself.`,
          `D) ∂L/∂b = 2(h-y) directly, because the sigmoid derivative cancels out for the bias term since b is treated as downstream of the activation rather than upstream of it.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `What is the vanishing gradient problem in a 10-layer network with sigmoid activations? How does it affect early vs late layers?`,
        options: [
          `A) Sigmoid's derivative is ≤0.25, and each layer multiplies that factor into the backward chain: ~0.25⁹ ≈ 3.8×10⁻⁶ by layer 1. The last layer trains at full gradient magnitude; the first layers get almost none and barely update.`,
          `B) Vanishing gradients occur when the learning rate is too high — sigmoid outputs saturate near 0 or 1, and early layers saturate first because they receive higher-magnitude updates, while late layers stay unsaturated and keep training.`,
          `C) Sigmoid compresses gradients by a factor of 4 per layer, but since 1/0.25=4, gradients are actually amplified going backward — early layers get larger gradients than late layers, the opposite of the usual description.`,
          `D) Vanishing gradients only occur when sigmoid is combined with small-weight initialisation; with weights scaled to unit variance, a 10-layer sigmoid network trains without any gradient attenuation at all.`,
        ],
        answer: `A`,
      },
      {
        q: `You compute gradient ∂L/∂W at batch size 32 vs batch size 1. How do the gradient magnitudes compare, and does this affect parameter updates?`,
        options: [
          `A) Batch 32 gradients are 32× larger than batch 1, because the batch gradient is the SUM (not average) of individual gradients — each update is 32× bigger, so the learning rate must be divided by 32 to match dynamics.`,
          `B) Batch 32 has 32× lower variance from averaging, and its magnitude is also 32× larger since batch gradients sum individual losses — large-batch training needs 32× smaller learning rates to match small-batch behaviour.`,
          `C) Batch 32 produces near-zero gradients for many parameters because averaging 32 samples cancels opposing directions. Batch 1 gives noisy but higher-magnitude gradients, which is why large batches converge to sharper minima.`,
          `D) Both estimate the same average gradient E[∂L/∂W], so magnitudes are roughly equal but batch 32 has lower variance. Scaling from B=32 to B=256 (8× larger) should scale the learning rate by 8 (linear scaling rule).`,
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
    summary: `Backprop's own closing promised this handoff directly: ReLU stops the vanishing-gradient message from shrinking on the way down, but it trades one failure for another — the dead neuron. That's where this module actually starts: not re-deriving why depth stalls (Backprop already showed that), but working out exactly when a ReLU neuron goes silent forever, and what to do about it.

First, the reminder that motivates the swap in the first place. Build a 10-layer network with sigmoid hidden layers, train it for an hour, and the loss barely budges — the last couple of layers learn, the first eight sit frozen.

As you saw in Backprop, a sigmoid's slope tops out at 0.25, and multiplying that in at every layer shrinks the signal to about 0.25¹⁰ ≈ one in a million by layer 10 — the early layers get no usable gradient and never learn. Swap sigmoid for **ReLU** in every hidden layer, retrain from scratch, and the whole network comes alive: loss drops, every layer updates, it converges. ReLU's slope is a clean 1 for any active neuron, so it passes the backward signal through untouched — no shrinking factor to compound.

The **activation function** is the little non-linear squash applied after each layer — what lets a network bend space instead of only drawing straight lines, and, as just shown, what decides whether the learning signal survives the trip backward through the layers.

[FIGURE: activations]

---

**ReLU's own flaw: the dead neuron.**

Look again at the same slope that just fixed vanishing gradients: ReLU's slope is exactly 1 for positive inputs, and exactly **0** for negative ones. Vanishing gradients were about the signal getting small everywhere at once; the dead neuron is a different failure — the signal goes to *exactly, permanently* zero for one specific neuron. If a neuron's input lands negative for *every* training example — often because one too-large gradient step shoved its bias down — ReLU outputs 0, its own slope there is 0, and it receives zero gradient *forever*. It cannot recover on its own: a slope of zero means no future update ever nudges it back toward positive territory. This isn't rare in practice — a too-high learning rate can silently kill 20–30% of a network's ReLU neurons within the first epoch, invisible on the loss curve.

**Leaky ReLU** fixes this cheaply by giving negatives a tiny slope (0.01) instead of a flat zero, so a trickle of gradient always flows and a neuron can climb back to positive territory. **GELU** goes further with a smooth curve that never fully flatlines and softly gates each input by how positive it is — which is why BERT, GPT, and essentially every modern Transformer use it.

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
    recap: [
      `**Picks up from Backprop's own promise:** Backprop closed on "ReLU trades vanishing gradients for the dead neuron" — this module starts there, not by re-deriving vanishing gradients from scratch.`,
      `**Recall — sigmoid kills gradients:** as Backprop showed, its slope is at most 0.25, multiplied in at every layer → ~0.25¹⁰ ≈ one-in-a-million after 10 layers, early layers stop learning. Activation choice is what decides whether the learning signal survives the trip backward through the layers — the whole history of activations is a sequence of gradient-flow fixes.`,
      `**ReLU fixes saturation:** "keep positives, zero out negatives" gives a clean slope of 1 for any active neuron, so it passes the backward signal through untouched — the single change that finally made 20-plus-layer networks trainable.`,
      `**ReLU's own flaw — the dead neuron — is a different failure than vanishing gradients:** not the signal shrinking everywhere, but going *exactly, permanently* zero for one neuron. If a neuron's input is negative for *every* example (often after one too-large gradient step shoves its bias down), it outputs 0, its slope is 0, and it receives zero gradient *forever* — dead and never recovers. Leaky ReLU gives negatives a tiny slope (0.01) so a trickle of gradient always flows; GELU does the same with a smooth curve.`,
      `**GELU:** a smooth curve that never fully flatlines and softly gates each input by how positive it is (weighting it by its probability of being positive under N(0,1)) — which is why BERT, GPT, and essentially every modern Transformer use it over ReLU.`,
      `**Output activation is a correctness constraint, not a preference:** all of the above is about *hidden* layers. For the output you must match the answer's type — sigmoid for a probability (binary), softmax for a class distribution, and no activation at all for a plain regression number. Putting ReLU on a classifier's output is a bug, not a tuning choice.`,
      `**Diagnostic — dead-neuron fraction:** count how many neurons output exactly zero across a validation batch; above 10% is a capacity problem (a too-high LR can kill 20–30% of ReLUs in one epoch, invisible on the loss curve). Fix by lowering the learning rate, using a better initialiser, or switching to Leaky ReLU / GELU.`,
    ],
    checkQuestions: [
      {
        q: `ReLU has a 'dying ReLU' problem. Explain mechanistically what causes it and what Leaky ReLU does to fix it.`,
        options: [
          `A) Dying ReLU happens because ReLU saturates at large positive values — very large pre-activations output the max representable float and gradients become numerically unstable. Leaky ReLU fixes this by capping positive outputs at a ceiling value.`,
          `B) If a neuron's pre-activation is negative for every training input, ReLU outputs 0 and ∂ReLU/∂a = 0, so the weight gradient is zero forever — the neuron is dead. Leaky ReLU keeps a small slope α=0.01 for a<0, giving dead neurons a chance to recover.`,
          `C) Dying ReLU is caused by vanishing gradients propagating from the output layer — early-layer neurons die because the signal has already decayed to near-zero by the time it reaches them. Leaky ReLU fixes this by amplifying gradients uniformly at every layer.`,
          `D) Dying ReLU occurs because ReLU compresses both positive and negative pre-activations toward zero, similar to sigmoid saturation. Leaky ReLU avoids this by maintaining gradient of exactly 1 for both large positive and large negative pre-activations.`,
        ],
        answer: `B`,
      },
      {
        q: `Why does GELU outperform ReLU in transformer architectures? What is its mathematical definition? Select the TWO correct statements.`,
        options: [
          `A) GELU(x) = x·Φ(x) where Φ is the standard normal CDF, approximated as 0.5x(1+tanh(√(2/π)(x+0.044715x³))) — it weights each input by its probability of being positive under N(0,1), acting as a soft gate.`,
          `B) GELU has no hard kink at x=0 like ReLU does, so the optimisation landscape stays smoother, and empirically BERT/GPT-2 and later models achieve lower perplexity with GELU than with a plain ReLU activation.`,
          `C) GELU uses a piecewise-quadratic form, x² for x>0 and 0 otherwise, whose stronger positive-region gradient than ReLU's linear region is why it learns more complex nonlinear attention relationships.`,
          `D) GELU is mathematically identical to Leaky ReLU with α=0.01, just applied after layer normalisation instead of after a dense layer, which changes its effective behaviour relative to standard usage.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Softmax output sums to 1 and is non-negative, so it is a valid probability distribution. However, neural networks trained with softmax are overconfident. Why?`,
        options: [
          `A) Cross-entropy drives softmax toward a one-hot target, so the model learns to widen the logit gap between the correct and incorrect classes — that same large-gap behaviour then fires on ambiguous test inputs. Fix: temperature scaling or label smoothing.`,
          `B) Softmax overconfidence is a pure function of class count: it always amplifies the top logit toward 1 regardless of input, and the amplification scales with the number of classes, so it mainly afflicts large multi-class problems, not binary classification.`,
          `C) Softmax is overconfident because a uniform distribution (equal logits) is its default, and moving away from that default inherently overshoots into overconfidence, since cross-entropy only penalises underconfidence in the correct class.`,
          `D) Overconfidence comes from the normalisation step itself: any real-valued logit becomes an inflated probability after normalising, so a logit of 5 becomes 0.99 regardless of how the model was trained or what the logit gaps actually are.`,
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

[FIGURE: norm_axes]

(One practical gotcha with batch norm: at inference you have no batch, so it switches to running averages collected during training. Forget to flip the model into eval mode and a single-example prediction gets normalised against a batch of one — which quietly produces garbage, with no error.)`,
    interactivePrompt: `Before you touch the controls: if you forget to call model.eval() at inference time with batch norm, what happens to a single-sample prediction — and why would it fail silently rather than throwing an error?`,
    keyPoints: [
      `**Batch norm for CNNs on images (batch size ≥ 16); layer norm for Transformers, RNNs, and any variable-length or small-batch task.**\n\nThe choice comes from what the statistics *mean*, not from tuning. Batch norm needs a batch of at least ~8 comparable examples or its per-batch estimates are too noisy to help. And always switch the model to eval mode at inference, so it uses the running averages instead of a (possibly size-1) batch — forgetting this is the single most common silent failure in deployed vision models.`,
      `**The trap: batch norm's train-versus-inference mismatch.**\n\nDuring training each example is normalised using its mini-batch's mean and spread; at inference the model uses running averages collected during training. If the input distribution shifts — new data source, different camera, different preprocessing — those stored averages are stale and the normalisation is wrong, and accuracy degrades with no error, no NaN, no warning. Fix it by running a few forward passes over data from the new distribution (in train mode) to refresh the running statistics before switching back to eval.`,
      `**The diagnostic: compare training loss at a large batch versus a small one.**\n\nIf the same model trains noticeably worse and noisier at batch size 4 than at 32, batch norm is the culprit — with only four samples the per-batch mean and variance are poor estimates and destabilise the normalisation. Swap in group norm or layer norm and re-run; if the gap closes, that confirms it.`,
    ],
    takeaway: `Normalisation stabilises the optimisation landscape so training converges; regularisation reduces capacity so the solution generalises — conflating the two is the source of most tuning mistakes.`,
    recap: [
      `**The problem — a moving target:** when a layer updates its weights, the distribution of numbers it emits shifts, so the layer above (which had learned to expect the old distribution) must scramble to re-adjust — and so on up the stack. Every layer chases a moving target, forcing a tiny learning rate so no update destabilises everything above it. Training crawls.`,
      `**Batch norm:** before passing numbers on, re-centre and re-scale each layer's outputs to mean 0, spread 1 *across the batch*, so the next layer always sees a familiar range. A learned pair of dials (γ scale, β shift) lets the network re-stretch if the task actually needs it, so nothing is lost.`,
      `**Payoff:** you can crank the learning rate 5–10× higher, the network stops caring so much about initialisation, and training converges much faster — this is what made pre-2015 deep nets far less fragile.`,
      `**Free regularisation:** the mean/spread come from the *current* mini-batch, so the same example is normalised slightly differently depending on its batch-mates. That ever-changing jitter mildly regularises — the network can't lean on any one example's exact representation (later work argues this loss-landscape smoothing, not the moving-target story, is the real reason BN helps).`,
      `**Batch norm vs layer norm is a correctness choice, not a knob:** BN normalises a feature *across the batch*, which only makes sense if the batch's examples are comparable — meaningless for tokens from different sentence positions. LN instead normalises *across a single example's features*, well-defined for one token at any position with any batch size. So CNNs on images use BN; Transformers, variable-length, and small-batch tasks use LN.`,
      `**Batch norm inference gotcha:** at inference there's no batch, so BN switches to running averages collected during training. Forget to call \`model.eval()\` and a single-example prediction gets normalised against a batch of one — silently producing garbage with no error thrown.`,
      `**Diagnostic:** if the same model trains much noisier and worse at batch 4 than at 32, BN's per-batch mean/variance estimates are too poor with few samples — swap in group norm or layer norm and if the gap closes, that confirms it.`,
    ],
    checkQuestions: [
      {
        q: `Batch normalisation has four parameters per feature: γ, β, μ_batch, σ_batch. Which are learned and which are computed? What happens at inference time?`,
        options: [
          `A) All four are learned: γ, β are trained by gradient descent to restore expressive capacity; μ_batch, σ_batch are also trained via exponential moving averages. At inference the same four learned values are used directly, with nothing recomputed from the input.`,
          `B) Only γ is learned; β, μ_batch, and σ_batch are all computed from the data. At inference, β comes from a running average of biases across training, and μ_batch, σ_batch are recomputed fresh from each inference batch.`,
          `C) μ_batch, σ_batch are computed from the mini-batch; γ, β are learned per feature to let the network undo normalisation. At inference, running averages (EMA from training) replace batch stats in the output formula.`,
          `D) γ and μ_batch are learned jointly as a single fused parameter to save memory, while β and σ_batch are computed fresh at every forward pass, including at inference, from whatever batch of examples happens to be currently available at request time.`,
        ],
        answer: `C`,
      },
      {
        q: `Why does batch normalisation act as a regulariser, reducing the need for dropout? Select the TWO correct mechanisms.`,
        options: [
          `A) Each mini-batch has different μ_batch and σ_batch, so a given example's normalised value shifts depending on which other examples share its batch — that noise stops the network from memorising exact representations.`,
          `B) Larger batch sizes reduce this batch-statistic noise since the mean/variance estimates converge to constants, which is why very large-batch training (B=4096+) gets less regularisation benefit from BN than small-batch training does.`,
          `C) BN clips any activation more than a few standard deviations from the mean toward zero, which is the same mechanism by which weight decay prevents the network from over-relying on any single weight dimension.`,
          `D) BN forces every intermediate activation to share identical zero-mean unit-variance distributions, which prevents layer co-adaptation entirely independently of and with zero overlap with what dropout regularises.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Layer normalization vs batch normalization: when do you use each, and what is the key structural difference?`,
        options: [
          `A) BatchNorm normalises per feature over all samples; LayerNorm normalises per sample over all features. BN suits CNNs with large, homogeneous batches; LN suits Transformers/RNNs with variable lengths.`,
          `B) BatchNorm normalises across all features within a sample just like LayerNorm, but additionally learns a per-sample scale/shift (γᵢ, βᵢ), while LayerNorm shares one γ, β across the whole batch — use BN for heterogeneous batches, LN for uniform batches instead.`,
          `C) The two differ only in whether they use a moving average at inference: BN keeps an EMA of batch statistics from training, while LN recomputes fresh per-sample statistics at test time, which is why LN suits homogeneous image batches better.`,
          `D) LayerNorm normalises across the batch dimension (mean/variance over all samples per feature), while BatchNorm normalises across the feature dimension per sample — the opposite of their usual names, since "Layer" refers to the whole network layer.`,
        ],
        answer: `A`,
      },
    ],
    interactiveId: 'batch_norm_viz',
    figures: {
      norm_axes: `<svg viewBox="0 0 360 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="90" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">BatchNorm</text>
  <text x="270" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">LayerNorm</text>
  <!-- axis labels -->
  <text x="14" y="105" text-anchor="middle" font-size="9" fill="var(--ink-low)" transform="rotate(-90,14,105)">batch (samples)</text>
  <text x="90" y="200" text-anchor="middle" font-size="9" fill="var(--ink-low)">features →</text>
  <text x="270" y="200" text-anchor="middle" font-size="9" fill="var(--ink-low)">features →</text>
  <!-- LEFT grid: 4 rows (samples) x 5 cols (features); highlight one feature column across batch -->
  <rect x="30" y="30" width="120" height="120" fill="var(--prime-faint)" stroke="var(--rim)" stroke-width="1"/>
  <rect x="54" y="30" width="24" height="120" fill="var(--amber)" opacity="0.85"/>
  <line x1="54" y1="30" x2="54" y2="150" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="78" y1="30" x2="78" y2="150" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="102" y1="30" x2="102" y2="150" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="126" y1="30" x2="126" y2="150" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="30" y1="60" x2="150" y2="60" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="30" y1="90" x2="150" y2="90" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="30" y1="120" x2="150" y2="120" stroke="var(--rim)" stroke-width="0.5"/>
  <text x="90" y="168" text-anchor="middle" font-size="8.5" fill="var(--ink-mid)">normalise 1 feature down the batch</text>
  <!-- RIGHT grid: highlight one sample row across features -->
  <rect x="210" y="30" width="120" height="120" fill="var(--prime-faint)" stroke="var(--rim)" stroke-width="1"/>
  <rect x="210" y="66" width="120" height="24" fill="var(--prime)" opacity="0.8"/>
  <line x1="234" y1="30" x2="234" y2="150" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="258" y1="30" x2="258" y2="150" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="282" y1="30" x2="282" y2="150" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="306" y1="30" x2="306" y2="150" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="210" y1="60" x2="330" y2="60" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="210" y1="90" x2="330" y2="90" stroke="var(--rim)" stroke-width="0.5"/>
  <line x1="210" y1="120" x2="330" y2="120" stroke="var(--rim)" stroke-width="0.5"/>
  <text x="270" y="168" text-anchor="middle" font-size="8.5" fill="var(--ink-mid)">normalise 1 sample across its features</text>
</svg>`,
    },
  },
  {
    id: 'optimizers',
    interactiveId: 'gradient_descent',
    title: 'Deep Learning Optimisers',
    subtitle: 'SGD, momentum, RMSProp, Adam, AdaGrad — convergence and learning rate schedules',
    difficulty: 'intermediate',
    estimatedMin: 31,
    tags: ['optimisers', 'Adam', 'SGD', 'learning rate', 'momentum'],
    summary: `You are training a ResNet on ImageNet with plain SGD at a fixed learning rate. After 30 epochs the loss flattens out. Switch to an optimiser that gives every weight its own effective step size, and in the next 5 epochs the loss drops more than it did in the previous 30. What just happened — and why might plain SGD still win in the end?

The core issue with one fixed learning rate is that different weights have wildly different lives. A weight in the embedding for a rare word might get a gradient once in a thousand steps; a weight in the final layer gets one every step. The same step size cannot suit both — the rare one needs a big push to make progress from its infrequent updates, the busy one needs small steps to avoid bouncing around its target.

Think of each weight as a hiker descending its own private mountain, carrying a cane that feels out how rough the terrain underfoot has been lately. A hiker on a long, gentle, featureless stretch takes big confident strides. A hiker on jagged, jumpy terrain takes small, careful ones. Force every hiker, on every terrain, to use the same fixed stride, and the gentle-terrain hiker crawls while the jagged-terrain one stumbles. **Adaptive optimisers** give each weight its own cane — its own effective learning rate, derived from its own gradient history.

---

**The lineage: AdaGrad → RMSProp → Adam.**

**AdaGrad** keeps, for every weight, a running *sum* of its squared gradients — v_t = v_{t-1} + g_t² — and scales its step by 1/√v_t: w_t = w_{t-1} − (η / √(v_t + ε))·g_t. A weight whose gradient has been small or rare keeps a small v_t and gets a comparatively large step; a weight updated every step accumulates a large v_t and its step shrinks.

Walk two weights through a few steps. A *busy* weight sees a gradient of magnitude 1 every step: v_1 = 1 (step scaled by 1/√1 = 1), v_2 = 1 + 1 = 2 (1/√2 ≈ 0.71), v_3 = 3 (1/√3 ≈ 0.58) — its effective step keeps shrinking. A *rare* weight sees nothing for 99 steps, then a single gradient of the same magnitude 1: its v_t is still just 1 at that point, giving it a step scaled by 1/√1 = 1 — noticeably bigger than the busy weight's step at that same moment (v_t ≈ 100, scale ≈ 1/√100 = 0.1). That is exactly the behaviour the earlier crisis called for: the busy weight self-throttles, the rare one still gets a real push the moment it fires.

But AdaGrad's sum only ever grows — on *dense* problems, where every weight behaves like the busy one, the step size keeps shrinking toward zero and learning eventually stalls entirely. **RMSProp** fixes this with a *decaying* running average instead of a running sum: v_t = β·v_{t-1} + (1 − β)·g_t² (β typically 0.9–0.99) — old squared gradients fade out geometrically instead of piling up forever, so the step size never collapses.

**Adam** adds one more piece on top of RMSProp: a momentum term that smooths the *direction*, not just the scale. It keeps m_t = β1·m_{t-1} + (1 − β1)·g_t (a running average of the gradient itself) alongside v_t = β2·v_{t-1} + (1 − β2)·g_t² (RMSProp's adaptive scale), bias-corrects both — m̂_t = m_t/(1 − β1^t), v̂_t = v_t/(1 − β2^t) — and updates with w_t = w_{t-1} − η · m̂_t / (√v̂_t + ε).

That bias correction matters more than it looks. Take the very first step, default β1=0.9, β2=0.999, and a gradient g_1 = 1.0: m_1 = 0.9·0 + 0.1·1.0 = 0.1, and v_1 = 0.999·0 + 0.001·1.0² = 0.001 — both estimates are still mostly their zero initialisation, badly underestimating the true gradient. Bias correction divides each by (1 − β^1): m̂_1 = 0.1/0.1 = 1.0, v̂_1 = 0.001/0.001 = 1.0 — the correction exactly cancels the initialisation bias on step 1, so Adam's first update is already essentially full-size (≈ −η), computed from a single noisy gradient with no history behind it yet. That is exactly why Transformer training needs a learning-rate *warmup*: those first, history-free steps are the least trustworthy ones Adam ever takes, and a full-size η at that moment is the single most common cause of an early training blow-up. The combination converges fast on almost anything, which is why Adam is the default for most deep learning.

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
    recap: [
      `**One fixed learning rate can't suit every weight:** a rare-word embedding sees a gradient maybe once in 1000 steps and needs big pushes when it does; a final-layer weight sees one every step and needs small ones. A single global step size serves neither well — each weight instead gets its own cane, sized to its own gradient history.`,
      `**AdaGrad:** v_t = v_{t-1} + g_t² (running *sum* of squared gradients), step = η/√(v_t+ε) · g_t. Toy trace: a busy weight (gradient every step) has v_3=3, step-scale 1/√3≈0.58 and shrinking; a rare weight (silent 99 steps, one gradient) still has v_t=1 at that moment, step-scale 1/√1=1 — bigger than the busy weight's ≈0.1 at step 100. Flaw: v_t only grows, so on dense problems the step decays to zero and training stalls.`,
      `**RMSProp:** swaps the sum for a decaying average, v_t = β·v_{t-1}+(1−β)·g_t² — old squared gradients fade instead of piling up, so the step never collapses.`,
      `**Adam:** adds momentum on RMSProp's scale — m_t=β1·m_{t-1}+(1−β1)·g_t, v_t=β2·v_{t-1}+(1−β2)·g_t², bias-corrected m̂_t=m_t/(1−β1^t), v̂_t=v_t/(1−β2^t), update w_t=w_{t-1}−η·m̂_t/(√v̂_t+ε). Adam is the default for most deep learning.`,
      `**Bias correction ≈ full step on step 1:** with g_1=1.0, β1=0.9, β2=0.999 → m_1=0.1, v_1=0.001 (both mostly zero-init) → correction gives m̂_1=0.1/0.1=1.0, v̂_1=0.001/0.001=1.0 → update ≈ −η already, from one noisy gradient with zero history. That's exactly why Transformers need learning-rate warmup — the earliest steps are the least trustworthy ones Adam takes, and a full-size η then is the most common cause of an early blow-up.`,
      `**SGD+momentum sometimes wins:** on image classification, well-tuned SGD often *beats* Adam on validation accuracy — Adam's per-weight rescaling slides neatly into the *nearest* (often sharp) minimum, while SGD keeps more gradient noise and drifts toward flatter, wider minima that generalise better under distribution shift. The trade is real: Adam gives speed, tuned SGD can give a slightly better final model.`,
      `**Use AdamW whenever you add weight decay:** plain Adam's L2-in-the-loss penalty gets distorted by the per-parameter rescaling (√v̂ divides the penalty down on exactly the weights that need it most — backwards), whereas AdamW applies the decay uniformly and directly to the weights. Always prefer AdamW.`,
      `**Never leave the learning rate fixed for the whole run:** decay it over time, and for Transformers *warm it up* first (start near-zero, ramp over ~1,000–4,000 steps) — at the start Adam's running estimates have no history, so full-size steps in noisy directions spike or diverge the loss. Missing warmup is the most common cause of early Transformer blow-ups.`,
      `**Diagnostic:** if Adam reaches a lower *training* loss but the same or worse *validation* loss than SGD, it found a *sharper* minimum, not a better one — and a shift in the test distribution punishes sharp minima. Lean toward SGD's flatter optima when deployment data differs; take Adam when training speed is the bottleneck.`,
    ],
    checkQuestions: [
      {
        q: `Adam is used with default parameters (β1=0.9, β2=0.999, ε=1e-8). Training loss decreases but validation loss starts increasing after epoch 10. Should you change the optimizer or change regularisation? Select the TWO correct actions.`,
        options: [
          `A) Recognise this as overfitting, not an optimizer problem — Adam is simply optimising the loss you gave it, and changing optimizer parameters would not address the underlying lack of regularisation on a limited dataset.`,
          `B) Switch to AdamW with weight_decay=0.01–0.1 instead of plain Adam, since Adam's L2-in-the-loss penalty gets distorted by the per-parameter rescaling and does not regularise correctly.`,
          `C) Switch to SGD+momentum (β=0.9), reasoning that Adam's β2=0.999 makes it remember too much gradient history to reduce its learning rate quickly enough once validation loss starts rising.`,
          `D) Increase β1 from 0.9 to 0.95 to add more momentum, since the validation loss rise is a symptom of Adam oscillating around the validation minimum that extra momentum would dampen.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Compare Adam and SGD+momentum on the training loss curves: Adam converges faster in early epochs, SGD is slower but eventually matches or beats Adam on validation. Why?`,
        options: [
          `A) Adam's per-parameter rates speed early convergence into the nearest, often sharper, minimum. SGD's uniform rate keeps more gradient noise, drifting toward flatter minima that generalise better.`,
          `B) Adam's faster convergence comes from an effectively larger batch size: dividing by √v̂ normalises gradient variance the same way averaging more samples would, while SGD's smaller effective batch trades speed for more stochastic exploration of the landscape.`,
          `C) Adam converges faster because bias correction makes its effective first-step learning rate 10× the base rate for β₁=0.9; SGD's lower early rate forces conservative updates that accidentally explore more of the landscape.`,
          `D) Adam's v̂ denominator approximates the diagonal Hessian, making it an approximate Newton's method, while SGD uses only first-order information and is therefore slower and less prone to overfitting the training minimum.`,
        ],
        answer: `A`,
      },
      {
        q: `A new dataset is available and you are fine-tuning a pre-trained ResNet with Adam. The last layer is randomly initialised, the rest are pre-trained. What learning rate do you use for each part?`,
        options: [
          `A) Use one shared learning rate (e.g. 1e-3) but apply 100× higher weight decay to the pre-trained layers than to the last layer — weight decay alone is sufficient to preserve pre-trained knowledge without needing separate rates.`,
          `B) Use a higher rate for the pre-trained layers (e.g. 1e-3) and a lower one for the random last layer (e.g. 1e-5), since the pre-trained layers must adapt aggressively to the new task while the random layer should update conservatively.`,
          `C) Use identical rates everywhere, but train in two phases: converge the last layer alone first, then unfreeze all layers jointly — Adam's own adaptive scaling already gives pre-trained layers smaller effective updates automatically at every step.`,
          `D) Use differential rates: much smaller for pre-trained layers (1e-5–1e-4, avoiding catastrophic forgetting) and much larger for the random last layer (1e-3–1e-2, needing substantial updates) — a 10–100× ratio is typical.`,
        ],
        answer: `D`,
      },
    ],
  },
  {
    id: 'cnns',
    interactiveId: 'cnn_convolution_viz',
    interactivePrompt: `Before you touch the controls: predict which kernel lights up the left and right sides of the square but stays dark along its flat top — and why one 3×3 filter can find that feature anywhere in the image with just 9 shared weights.`,
    title: 'Convolutional Neural Networks',
    subtitle: 'Convolution mechanics, pooling, receptive field, translation equivariance',
    difficulty: 'intermediate',
    estimatedMin: 31,
    tags: ['CNN', 'convolution', 'pooling', 'receptive field', 'computer vision'],
    summary: `Take a 28×28 MNIST digit — 784 raw pixels. Feed them into a flat linear layer of 128 units and you need 784×128 = 100,352 parameters just for that one layer. Worse than the parameter count: the model treats pixel (3,4) and pixel (3,5) as completely independent inputs. Nothing in the architecture says these two pixels are neighbours, that they participate in the same local edge, or that an edge at position (3,4) is the same *kind* of feature as an edge at position (15,20). If the model wants to recognise "a horizontal edge," it has to separately learn that concept, from scratch, at every one of the 784 positions it might appear.

Picture a stencil — a small cut-out pattern you can lay over any part of a larger surface and trace through. Cut the stencil for a horizontal edge once, and you can hold it up to *any* patch of the image; the same nine numbers on the stencil test for "is there a horizontal edge here" whether "here" is the top-left corner or the dead centre. Now picture the flat linear layer's alternative: instead of one reusable stencil, it hand-draws a *separate* horizontal-edge detector at every single position, never reusing the shape it already learned three pixels over. That is the structural gap a flat layer can't close on its own — it has no notion that "here" and "three pixels to the right" might want the same test.

**Convolution** is that stencil, made mathematical. A 3×3 filter slides across the image, computing a dot product at every position: the same 9 weights applied at (3,4), at (15,20), and at every other location. That is **weight sharing** — the filter has 9 parameters regardless of image size. Learn a horizontal-edge detector once and it fires on horizontal edges *everywhere*, because the same weights do the computation everywhere — a single 3×3 filter does with 9 numbers what the flat layer above needed 100K numbers to attempt. **Pooling** takes a filter's output over a small spatial region and keeps only the maximum: if the edge appeared slightly left or slightly right within that region, the pooled value is the same either way — a small, deliberate loss of exact position in exchange for *position invariance*. Stack several convolutional layers and a hierarchy emerges: the first layer detects edges, the second combines edges into corners and curves, the third into shapes, the fourth into objects. Each deeper neuron's **receptive field** — the patch of the *original* image its value depends on — grows with every convolution it sits behind: a neuron at layer 5 of a 3×3-stride-1 network has a receptive field of 11×11 pixels, spanning a neighbourhood wide enough to cover multiple objects, not just one edge.

[FIGURE: receptive_field]

**NOT this.** "CNNs were designed for images." The principle — local patterns plus translation equivariance — applies anywhere locality matters. 1D CNNs classify audio and DNA sequences, where adjacent time steps or nucleotides are locally related. 3D CNNs process video, where nearby frames in time are locally correlated. Graph CNNs extend the idea to molecular structures and social networks. The architecture is not about pixels; it is about exploiting whatever spatial or sequential structure your data has. If your input has the property that neighboring elements are more related than distant elements, a convolutional inductive bias is appropriate. If your input is a bag of features with no meaningful ordering, it is not.`,
    keyPoints: [
      `**Use CNNs over MLPs whenever the input has local structure — weight sharing cuts parameters 10–100× and builds in the right inductive bias.**\n\nA flat MLP applied to a 224×224 image needs 150M parameters in the first layer alone. A convolutional layer with 64 filters of size 3×3 needs 64×9×3 = 1,728 parameters, regardless of image size. The accuracy gain is not from having more parameters — it is from encoding the assumption that local patterns repeat, which is correct for images, audio, and sequences.`,
      `**Trap: deepening a CNN without residual connections kills gradients — VGG-19 was state of the art; ResNet-152 beat it by simply adding skip connections. Depth without residuals is not free.**\n\nWith plain convolutions, a 50-layer network was harder to train than a 34-layer network — more depth actually hurt. The skip connection output = F(x) + x gives the gradient a direct path: ∂L/∂x includes the identity term regardless of what F does. This one change unlocked reliable training at 100+ layers. If your CNN depth is above ~10 layers and you are not using residuals, the network is likely training with near-zero gradient in early layers.`,
      `**Diagnostic: if early-layer filters look like random noise after training, the network is not learning — check learning rate, initialization, and whether input is normalized.**\n\nHealthy early filters in a CNN trained on images look like oriented edge detectors and color blobs — not random static. Visualize the first-layer weights after 1 epoch. If they are still indistinguishable from the initialization, the gradient is not reaching them. Candidate causes: learning rate too small for the layer depth, missing or wrong normalization on inputs, or vanishing gradients from missing residuals.`,
    ],
    interactivePrompt: `Before you touch the controls: a 3×3 filter applied with stride 1 to a 28×28 image produces a 26×26 output — if you stack three such layers, what is the receptive field of a single output neuron in the final layer, and does it see the full image?`,
    checkQuestions: [
      {
        q: `A convolutional layer has filter size 3×3, 64 input channels, 128 output channels. How many parameters? How does this compare to a fully connected layer with the same input/output dimensions? Select the TWO correct statements.`,
        options: [
          `A) Each of 128 filters has 3×3×64=576 weights + 1 bias = 577 parameters, so the conv layer totals 128×577=73,856 parameters — the same 576 weights are shared at every spatial location, which is what keeps this count independent of image size.`,
          `B) An FC layer over 28×28 feature maps needs input_dim×output_dim ≈ (28×28×64)×(28×28×128) ≈ 5×10⁹ parameters — roughly five orders of magnitude more than the conv layer's ~74K, because it has no weight sharing across positions.`,
          `C) The conv layer uses depthwise convolutions, so the 64 input channels don't multiply into the parameter count at all: 128 filters × 3×3 weights = 1,152 parameters total, independent of how many input channels there are.`,
          `D) Modern conv layers omit biases entirely because batch norm's β parameter makes them redundant, giving 3×3×64×128=73,728 weights only — identical in parameter count to an FC layer whenever the spatial size collapses to 1×1.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why does max pooling help with spatial invariance, and what is the downside for tasks requiring precise localisation?`,
        options: [
          `A) Max pooling computes the mean activation over each window, which is insensitive to small shifts since nearby pixels are similar; the downside is that averaging blurs segmentation boundaries by diluting edge activations with non-edge neighbours.`,
          `B) Max pooling selects the dominant feature per region, focusing on presence rather than exact position; the downside is that it discards non-maximum activations entirely, and those values carry gradient signal that localisation tasks actually need to succeed.`,
          `C) Max pooling over 2×2 windows keeps the same output for small shifts, building translation invariance; the downside is that pooling loses exact position — fixed by skip connections (U-Net) or transposed convolution upsampling.`,
          `D) Max pooling normalises activation magnitudes to the window maximum, making the network robust to lighting rather than position; the downside is that max-normalised features can't be compared across scales, hurting multi-scale detection.`,
        ],
        answer: `C`,
      },
      {
        q: `What is the receptive field of a neuron after three 3×3 convolutional layers (no pooling)? Why does depth matter for receptive field size?`,
        options: [
          `A) The receptive field is 9×9, since each 3×3 layer triples it: 3→9→27, capped by output size at 9×9. Depth matters because RF grows multiplicatively — three 3×3 layers therefore equal one 27×27 convolution in receptive field size.`,
          `B) The receptive field stays 3×3 regardless of depth, since each filter only ever sees a 3×3 patch of its immediate input layer — depth only builds a feature hierarchy, never a wider spatial receptive field at all.`,
          `C) Layer 1 sees 3×3, layer 2 sees 5×5, layer 3 sees 7×7 — RF=2×depth+1 for stacked 3×3 layers, matching a single 7×7 layer's RF with fewer parameters (27 vs 49) and more nonlinearity — the VGG justification.`,
          `D) The receptive field remains 3×3 with no pooling, since stride-1 convolutions never expand spatial context on their own — RF growth strictly requires stride greater than 1 or pooling layers inserted between convolutions.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `A CNN's efficiency comes entirely from weight sharing: the same filter applied everywhere encodes the assumption that features repeat across space, cutting parameters 100× versus a flat model and building translation equivariance into the architecture by construction.`,
    recap: [
      `**Flat layers are blind to spatial structure:** an MLP treats pixel (3,4) and (3,5) as completely independent inputs — nothing says they're neighbours or that an edge at one position is the same feature as an edge elsewhere, so it must relearn every feature separately at every position (and a 28×28 digit alone needs ~100K weights for one 128-unit layer).`,
      `**Stencil metaphor → convolution:** a reusable stencil tested against any patch of a surface is what a flat layer lacks — it hand-draws a separate detector at every position instead of reusing one. Convolution = weight sharing: the same 3×3 filter (9 weights) slides across the whole image, computing the same dot product at every location — learn a horizontal-edge detector once and it fires on edges *everywhere*. That's 9 params where a flat layer needs ~100K.`,
      `**Pooling = position invariance:** keep only the max activation over a small region, so a feature that appeared slightly left or right gives the same pooled value. The downside is lost localisation — after a few pooling layers you know a feature exists in a region but not exactly where (why segmentation uses skip connections / U-Nets).`,
      `**Stacking builds a hierarchy:** layer 1 detects edges, layer 2 combines them into corners and curves, layer 3 into shapes, layer 4 into objects — and each deeper neuron's *receptive field* grows, so it "sees" a wider slice of the original image.`,
      `**Not just images:** the real principle is local patterns + translation equivariance, which applies to 1D (audio, DNA), 3D (video), and graphs (molecules, social networks) — any data where neighbouring elements are more related than distant ones. A bag of unordered features is where it does *not* apply.`,
      `**Trap — depth without residuals kills gradients:** a plain 50-layer CNN trained *worse* than a 34-layer one; the skip connection (output = F(x) + x) gives the gradient a direct identity path (∂L/∂x keeps an identity term regardless of F), which unlocked reliable training past 100 layers. Above ~10 layers with no residuals, early layers likely train on near-zero gradient.`,
      `**Diagnostic:** visualise first-layer filters after one epoch — healthy ones look like oriented edge detectors and colour blobs. Still-random static means the gradient isn't reaching them: check learning rate, input normalisation, and missing residuals.`,
    ],
    figures: {
      receptive_field: `<svg viewBox="0 0 360 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="15" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">receptive field grows with depth</text>
  <!-- input grid 8x8 at left -->
  <text x="45" y="38" text-anchor="middle" font-size="9" fill="var(--ink-low)">input</text>
  <g stroke="var(--rim)" stroke-width="0.5" fill="var(--prime-faint)">
    <rect x="15" y="45" width="80" height="80"/>
  </g>
  <g stroke="var(--rim)" stroke-width="0.5">
    <line x1="35" y1="45" x2="35" y2="125"/><line x1="55" y1="45" x2="55" y2="125"/><line x1="75" y1="45" x2="75" y2="125"/>
    <line x1="15" y1="65" x2="95" y2="65"/><line x1="15" y1="85" x2="95" y2="85"/><line x1="15" y1="105" x2="95" y2="105"/>
  </g>
  <!-- 3x3 filter window highlighted -->
  <rect x="35" y="65" width="60" height="60" fill="var(--amber)" opacity="0.7" stroke="var(--amber)" stroke-width="1.5"/>
  <text x="45" y="140" text-anchor="middle" font-size="8" fill="var(--ink-mid)">3×3 filter</text>
  <!-- layer 1 feature: single cell -->
  <text x="185" y="38" text-anchor="middle" font-size="9" fill="var(--ink-low)">layer 1</text>
  <rect x="170" y="75" width="20" height="20" fill="var(--prime)" opacity="0.85" stroke="var(--rim)" stroke-width="0.5"/>
  <text x="180" y="110" text-anchor="middle" font-size="8" fill="var(--ink-mid)">sees 3×3</text>
  <!-- arrows -->
  <line x1="100" y1="95" x2="165" y2="88" stroke="var(--ink-low)" stroke-width="1" marker-end="url(#rf-a)"/>
  <line x1="195" y1="88" x2="255" y2="88" stroke="var(--ink-low)" stroke-width="1" marker-end="url(#rf-a)"/>
  <!-- layer 2 feature -->
  <text x="290" y="38" text-anchor="middle" font-size="9" fill="var(--ink-low)">layer 2</text>
  <rect x="278" y="75" width="24" height="24" fill="var(--prime)" opacity="0.85" stroke="var(--rim)" stroke-width="0.5"/>
  <text x="290" y="114" text-anchor="middle" font-size="8" fill="var(--ink-mid)">sees 5×5</text>
  <text x="180" y="165" text-anchor="middle" font-size="9" fill="var(--ink-mid)">same 9 shared weights applied at every position (weight sharing)</text>
  <text x="180" y="180" text-anchor="middle" font-size="9" fill="var(--ink-low)">each deeper neuron sees a wider slice of the input</text>
  <defs>
    <marker id="rf-a" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--ink-low)"/></marker>
  </defs>
</svg>`,
    },
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
          `A) BPTT gives ∂L/∂W_h at t=1 as a product of 199 Jacobians ∂h_t/∂h_{t-1}. The cell-state path adds ∂c_t/∂c_{t-1}=f_t, so a forget gate near 1 gives an unobstructed gradient highway across 200 timesteps.`,
          `B) The gradient for W_h at t=1 comes exclusively from the local loss L₁ — each timestep's update uses only that timestep's loss, and the total gradient is the independent sum ∂L₁/∂W_h + ... + ∂L₂₀₀/∂W_h with no propagation across time at all.`,
          `C) W_h is updated only from the gradient at the final timestep T=200, since h₂₀₀ is the only output used for the loss — the gating mechanism blocks gradients from flowing back through any intermediate timestep to protect the cell state.`,
          `D) The gradient flows backward through the output gate only — the forget and input gates block gradient propagation entirely to preserve long-range memory, so early W_h updates depend solely on the output-gate pathway, never on the forget path.`,
        ],
        answer: `A`,
      },
      {
        q: `What is the key mathematical difference between an LSTM cell and a GRU cell? Select the TWO correct statements.`,
        options: [
          `A) LSTM has 4 gates and 2 state vectors (h and c) with a cell state update c_t = f_t*c_{t-1} + i_t*g_t (additive, ResNet-like); GRU has 3 gates and 1 combined state, ~25% fewer parameters, with h_t = (1-z_t)*h_{t-1} + z_t*new_h_t.`,
          `B) Empirically, performance differences between LSTM and GRU are usually small; GRU is often preferred for smaller datasets or tighter compute budgets, since dataset and tuning tend to matter more than the architectural choice itself.`,
          `C) LSTM uses multiplicative gating that can fully suppress or pass information, while GRU only uses additive gating that shifts values, making LSTM strictly more expressive for binary memory tasks like matching parentheses.`,
          `D) LSTM's forget gate starts at sigmoid(0)≈0.5, giving poor gradient flow that must improve during training, while GRU's update gate initialises near 1 for good gradient flow from the start — which is why GRU always trains faster in early epochs.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Teacher forcing trains RNNs with ground-truth tokens as inputs, but at test time, the model uses its own predictions. What problem does this cause?`,
        options: [
          `A) The model becomes dependent on ground-truth token embeddings' specific mean/variance, which differ from its own predicted embeddings at test time, shifting hidden-state activation distributions — a form of internal covariate shift absent during training.`,
          `B) Exposure bias: training never exposes the model to its own wrong predictions, so a wrong token at test time cascades into further errors. Fixes: scheduled sampling, professor forcing.`,
          `C) Teacher forcing gives a slower learning signal because correct inputs mean the model never practices error recovery, so it only learns to operate on the narrow manifold of hidden states reachable from correct-input histories.`,
          `D) Teacher forcing trains the conditional P(x_t | ground-truth history) instead of the true P(x_t | its own past predictions), so at test time the model needs the latter but only learned the former, producing a fixed distribution mismatch.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The LSTM's cell state is an additive gradient highway: when the forget gate stays near 1, the gradient flows back through hundreds of steps without shrinking — the one mechanism that vanilla RNNs lack and the reason LSTMs remain the right choice for any task where inference is sequential, real-time, and the full sequence is not available.`,
    recap: [
      `**Vanilla RNN vanishing gradient:** to learn that "not" two tokens back flips the sentiment, the gradient must travel back through one Jacobian per timestep, each with spectral radius under 1 (say ~0.5) → 0.5²⁰ ≈ 10⁻⁶ after 20 steps. The early-token signal can't reach the loss strongly enough to update its weights, so long-range dependencies simply aren't learned.`,
      `**LSTM cell state = an additive gradient highway:** alongside the hidden state it carries a cell state with an *additive* update, C_t = f_t ⊙ C_{t-1} + i_t ⊙ g_t. The gradient of C_t with respect to C_{t-1} is just the forget gate f_t — no per-step shrinking multiplication, unlike the vanilla RNN's Jacobian chain.`,
      `**Forget gate near 1 preserves the signal:** because ∂C_t/∂C_{t-1} = f_t, the network can *learn* to keep f_t ≈ 1 exactly where memory should be preserved, giving the early token a nearly unobstructed path back to the loss across hundreds of steps.`,
      `**GRU:** achieves similar gated behaviour with two gates instead of the LSTM's four, ~25% fewer parameters, and empirically comparable performance on most tasks — prefer it on smaller datasets or when compute is tight.`,
      `**Not obsolete:** for offline NLP with the full sequence available, Transformers win almost every benchmark — but RNNs remain correct for *streaming* inference (audio, live feeds, robotics) where you don't have the whole sequence. Attention needs all positions present at once (O(n²) memory); an RNN processes each new token in O(1) with fixed memory.`,
      `**Trap — LSTMs don't fully fix vanishing:** beyond ~200 steps the product of many forget gates (each just under 1) still compounds toward zero. LSTMs beat vanilla RNNs at 20–50 steps; for 500+ step dependencies with the full sequence available, attention is strictly better.`,
      `**Diagnostic:** initialise the forget-gate bias to 1.0, not 0 — sigmoid(0)=0.5 already halves the cell-state gradient path at every step from the start. Then log ‖∂L/∂h_t‖ per timestep; exponential decay toward step 1 is the vanishing signature.`,
    ],
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
    summary: `The RNN/LSTM module ended on a ceiling: even with the forget gate holding a gradient highway open, reaching back reliably still degrades past a couple hundred steps, and even a *ten*-step reach has already threaded through several forget gates along the way. Is there a mechanism where reaching an earlier word costs exactly the same — one step — no matter how far back it is?

Start with a smaller, more concrete version of the same question. Take "The bank by the river was steep." To resolve *which* "bank" this is — the sloped edge of a river, not a financial institution — a model has to notice that "river" sits nearby, and lean on it heavily. Now take an unrelated sentence: "The bank raised its interest rate." Here the correct reading needs "interest rate" instead, and nothing about geography. Different sentences, different neighbor — but the same underlying move both times: look at *some* other words, decide how much each one matters for the word you're resolving right now, and lean on the ones that matter.

Picture each word not as a fixed dot but as a color. Understanding "bank" in context means mixing in a lot of "river"'s color and almost none of "interest"'s — a blend, weighted by relevance, not a copy of any single neighbor. That blend is what **attention** computes, formally, and it is the single idea behind every Transformer.

The old way (encoder-decoder RNNs, circa 2014) could not do this at all — it crammed the whole sentence into one fixed-size summary vector before translation even began. By the time the model reached "bank," that summary had been overwritten word by word and the "river" clue was diluted or gone. Attention replaces the single squeezed summary with a direct, weighted look back at every earlier word, no matter how many sit in between.

---

**Q, K, V — the mechanism.**

Think of it like a library search: you show up with a question (a **query**), every book carries a catalog tag describing what it's about (a **key**), and the book itself is what you walk away with (its **value**). You compare your question against each tag and lean on the books whose tags match best. In self-attention, every word does all three jobs at once — question-asker, catalog-tag, and payload — for every other word, simultaneously.

None of this is hand-designed. Each token's embedding is multiplied by three learned matrices — W_Q, W_K, W_V — trained by the exact same backpropagation that trains every other weight in the network; the network decides for itself, from data, what makes a good "question" and a good "tag" for the task at hand. To decide how much word *i* should attend to word *j*, compare *i*'s query with *j*'s key (a dot product) — a big match means "this one is relevant." Run all those scores through a softmax [reminder: softmax turns any list of numbers into positive weights that sum to 1] so they become attention weights, then take the weighted average of the *values*. That is the whole operation.

**Watch it work on the sentence above**, with tiny stand-in numbers for what a trained model would actually produce (real weights run to hundreds of numbers; two numbers per word is enough to walk the arithmetic by hand). Give "The," "bank," and "river" 2-number embeddings: x_The = [1, 0], x_bank = [0, 1], x_river = [2, 1]. Say the network has already learned W_Q = [[2, 0], [1, 3]], W_K = [[1, 1], [2, 0]], W_V = [[1, 0], [0, 2]].

"Bank"'s query is x_bank · W_Q = [1, 3] — call this **q_bank**, the question "bank" is asking of every other word. Every word's key comes from the same W_K: k_The = [1, 1], k_bank = [2, 0], k_river = [4, 2] — the catalog tags q_bank will be compared against. The **raw relevance score** for each word is the dot product q_bank · k: against "The," 1×1 + 3×1 = 4; against itself, 1×2 + 3×0 = 2; against "river," 1×4 + 3×2 = 10 — already the largest of the three.

Divide each raw score by √d_k (here d_k = 2, so √2 ≈ 1.41) to get the **scaled relevance score**: 2.83, 1.41, 7.07. Run those three through softmax and you get attention weights of about 1.4% on "The," 0.3% on itself, and 98.2% on "river" — "bank" has decided, almost entirely, to lean on "river." Compute the values: v_The = [1, 0], v_bank = [0, 2], v_river = [2, 2]. Blend them by the attention weights: 0.014×[1,0] + 0.003×[0,2] + 0.982×[2,2] ≈ [1.98, 1.97] — call this **"bank"'s attention-updated representation**. It lands almost exactly on top of v_river = [2, 2]: after one attention step, "bank"'s vector has absorbed nearly all of "river" and almost none of "The" or itself. The disambiguation the opening paragraph asked for has happened, numerically, inside this arithmetic.

[FIGURE: attention_heatmap]

**Why divide by √d_k at all?** In this 2-dimensional toy it barely matters — leaving the scores unscaled (4, 2, 10) pushes "river"'s weight from 98.2% up to 99.7%, since a gap of 10 versus 2 already dominates the softmax either way. But real attention runs with d_k up in the tens or low hundreds, not 2 — and the *variance* of a dot product between random-looking query and key components grows with d_k (each of the many summed terms adds its own variance). At d_k = 64, typical raw scores can land dozens of points apart instead of single digits like this toy's 10 vs. 2. Feed a spread that wide into softmax and it collapses to a near one-hot pick — one word gets essentially all the weight, every other path's gradient goes to zero, and the model stops being able to learn from them. Dividing by √d_k rescales the spread back down to roughly what this toy example shows, keeping the softmax soft enough that gradients keep flowing through more than one path.

---

**Many heads, many kinds of relationship.**

A single attention pass, with one W_Q/W_K/W_V, can only capture one *kind* of relationship at a time. So Transformers run several in parallel — **multi-head attention** — each head with its own learned W_Q, W_K, W_V, and therefore its own queries, keys, and values. One head might specialize in grammatical links (verb ↔ subject), another in word meaning, another in position. Their outputs are combined, giving the model several different lenses on the same sentence instead of forcing everything through one.

The catch is cost: comparing every word with every other word is **O(n²)** — double the sequence length and you quadruple the work and memory. That quadratic cost is the single biggest constraint on long-context Transformers, and a whole family of tricks (FlashAttention, sparse attention, and others) exists to tame it.`,
    interactivePrompt: `Before you touch the controls: in multi-head attention with 8 heads and d_model=512, each head operates on dimension 64 — can a single head with d_model=512 represent everything 8 heads with d=64 can, and what would be lost?`,
    keyPoints: [
      `**Use self-attention when the task requires modeling relationships between any two positions in a sequence, especially when those positions are far apart.** Encoder-only (bidirectional) attention for classification and understanding tasks; causal (masked) attention for generation. For sequences longer than ~8k tokens, O(n²) memory becomes the bottleneck — use FlashAttention (exact, 2–4× faster, O(n) memory via tiling) as the first-line solution before considering approximate methods. Cross-attention applies when you need one sequence to query another — translation, image captioning, conditioning in diffusion models.`,
      `**The production trap: missing causal mask in autoregressive models.** Without masking future positions to −∞ before softmax, the model during training can attend directly to the token it is predicting — achieving near-zero training loss while learning nothing about language. The symptom is excellent training loss and near-random test generation. Always verify the causal mask is applied before the softmax, not after. Multi-head attention in decoder-only models must use upper-triangular masking for every head.`,
      `**The diagnostic: visualise attention weights on a known example before trusting any trained model.** For an encoder model, check whether the attention distribution for a given word is concentrated on related words (e.g., the subject attends to its verb) or diffuse noise. Uniform attention weights across all positions indicate the model has not learned meaningful relationships — either the query-key projections are not trained or the softmax temperature is too high. Log the entropy of attention distributions per head per layer: low entropy = head is attending specifically; high entropy = head is attending uniformly (potentially wasted capacity).`,
    ],
    takeaway: `Self-attention creates an O(1) information path between any two positions in a sequence — that is the property RNNs cannot replicate without exponential gradient attenuation, and the O(n²) memory cost is the price every efficient Transformer variant is trying to reduce.`,
    deeperMath: [
      `**Derivation: why Var(q·k) = d_k.** Let q, k ∈ ℝ^{d_k} have independent components with mean 0 and variance 1 (the standard regime after Xavier/He-style initialization keeps activations roughly unit-scale). The dot product q·k = Σ_{i=1}^{d_k} q_i k_i sums d_k independent, zero-mean terms. Each term has E[q_i k_i] = E[q_i]·E[k_i] = 0 (independence) and Var(q_i k_i) = E[q_i² k_i²] = E[q_i²]·E[k_i²] = 1·1 = 1. Summing d_k independent zero-mean terms adds their variances: Var(q·k) = Σ_{i=1}^{d_k} Var(q_i k_i) = d_k. So the standard deviation of the raw dot product grows as √d_k — at d_k=64, std ≈ 8; at d_k=512, std ≈ 22.6 — and dividing the score by exactly √d_k (not d_k, not a constant) cancels this growth precisely, returning the scaled score to unit variance regardless of d_k.`,
      `**The softmax Jacobian, exactly.** For softmax output p_i = e^{z_i} / Σ_j e^{z_j}, the derivative is ∂p_i/∂z_j = p_i(δ_ij − p_j), where δ_ij = 1 if i = j and 0 otherwise. When one p_i → 1 and the rest → 0 — the near one-hot regime that unscaled, wide-spread logits push the distribution toward — every entry of this Jacobian collapses toward 0: p_i(1 − p_i) → 0 for the winning index, and p_i·p_j → 0 for every losing pair. "Gradients dry up" is not a figure of speech here; it is this Jacobian evaluated at a near one-hot distribution, entrywise zero.`,
      `**Multi-head parameter accounting.** For h heads over model width d_model, each head projects to d_k = d_model/h. Per head: W_Q, W_K, W_V are each d_model×d_k; after concatenating all h heads back to width d_model, one shared output projection W_O of shape d_model×d_model is applied once. Total attention parameters: h·(3·d_model·d_k) + d_model² = 3·d_model·(h·d_k) + d_model² = 3·d_model² + d_model² = 4·d_model² — independent of h, since h·d_k = d_model by construction. Splitting a fixed d_model into more heads is free in parameter count; the cost of multi-head attention lives entirely in d_model, not in how many heads it is divided into.`,
    ],
    recap: [
      `**Ceiling this module removes:** LSTM's forget-gate highway (previous module) still degrades past ~200 steps; attention gives an O(1) reach to *any* earlier word regardless of distance.`,
      `**Core need, demonstrated twice:** "bank" needs "river" nearby to read as riverbank, not the financial sense; "bank raised its interest rate" needs "interest rate" instead — same move both times: weigh other words by relevance, lean on the ones that matter.`,
      `**Attention = a weighted blend**, not a copy of one neighbor — mix in a lot of "river"'s representation, almost none of "interest"'s. Old encoder-decoder RNNs couldn't do this: one fixed-size summary vector, overwritten word by word, diluting exactly the clue that mattered.`,
      `**Q, K, V are computed, not hand-designed:** x·W_Q, x·W_K, x·W_V — three matrices learned by the same backprop as every other weight — give each token a query ("what am I looking for"), key ("what do I offer"), value ("what I hand over if picked").`,
      `**Mechanism:** score = Q·K (dot product, big match = relevant) → scale by √d_k → softmax [outputs positive weights summing to 1] → weighted average of the *values*.`,
      `**Worked toy (d=2):** q_bank·k_river=10 vs. 4 ("The") and 2 (itself) → scaled ≈7.07/2.83/1.41 → softmax ≈98.2%/1.4%/0.3% → blended output ≈[1.98,1.97], almost exactly v_river=[2,2]. Disambiguation happens inside the arithmetic.`,
      `**Why √d_k:** dot-product variance grows with d_k; at real d_k (tens–hundreds) unscaled scores spread far enough apart to push softmax to near one-hot, zeroing gradients on every other path. Scaling keeps it soft enough to keep learning (barely visible at this toy's d_k=2, decisive at d_k=64+).`,
      `**Multi-head attention runs several in parallel,** each with its own W_Q/W_K/W_V — one head can track grammar, another meaning, another position — several lenses instead of forcing everything through one.`,
      `**The catch is O(n²) cost:** doubling sequence length quadruples work and memory — the single biggest constraint on long-context Transformers; FlashAttention, sparse attention, and similar tricks exist to tame it.`,
    ],
    checkQuestions: [
      {
        q: `In scaled dot-product attention, why divide by √d_k? What happens without this scaling for large d_k? Select the TWO correct statements.`,
        options: [
          `A) For i.i.d. mean-0, variance-1 query and key components, q·k has variance d_k, so for large d_k (e.g. 512) the dot product's std is √512≈22.6 — large enough that softmax goes nearly one-hot and gradients through it vanish.`,
          `B) Dividing by √d_k renormalises q·k/√d_k to std≈1, keeping softmax in a moderate-temperature regime where it stays soft enough for gradients to flow, rather than collapsing to a hard selection.`,
          `C) The scaling exists to keep logits comparable across heads with different d_k in multi-head attention — without it, heads with larger d_k would saturate softmax while smaller heads would not, making multi-head attention internally inconsistent.`,
          `D) Dividing by √d_k sets the softmax temperature to exactly 1/d_k, and without it the temperature would instead be proportional to d_k itself, sharpening the distribution and shrinking the effective batch size used in value aggregation.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Multi-head attention uses h parallel attention heads, each with dimension d_k = d_model/h. Why is multi-head attention more expressive than single-head attention with dimension d_model?`,
        options: [
          `A) Multi-head attention has h times more total parameters than single-head attention at d_model, since each head gets its own full-size Q/K/V projections — the expressiveness gain comes from that larger parameter budget, not from any diversity of patterns.`,
          `B) Each head has its own projections, so heads specialise — syntax, co-reference, position — where one distribution over d_model couldn't represent multiple relationships at once. Ablations confirm heads have selective effects.`,
          `C) Smaller d_k per head makes softmax sharper, effectively producing sparse attention per head; stacking h sparse patterns covers more of the input space than one diffuse pattern would over the full d_model dimension.`,
          `D) Multi-head factorises the QKᵀ outer product into h smaller low-rank subspaces, and it's this low-rank regularisation of each head's attention matrix — not pattern diversity — that improves generalisation over a single high-rank matrix.`,
        ],
        answer: `B`,
      },
      {
        q: `Attention has O(n²) complexity in sequence length n. For a 10,000-token document, what is the computational problem, and what are the main approximation approaches?`,
        options: [
          `A) Full attention needs n×n=100M scores per head; across many heads/layers, storing all matrices costs ~200GB, exceeding GPU memory. Fixes: sparse attention (O(n·k)), linear attention (O(n)), FlashAttention (tiled O(n²), 2–4× faster).`,
          `B) At d_model=512, each pairwise dot product costs O(512) not O(1), so total cost is O(n×d) rather than O(n²); the real fix is reducing the projection dimension d (e.g. d=64) while still computing every one of the n×n pairs.`,
          `C) The bottleneck is purely sequential GPU throughput — n=10,000 tokens need ceil(n/b) sequential steps for batch size b; fixes include raising GPU batch size, skipping zero-attention pairs, or pooling the attention matrix into a fixed-size summary.`,
          `D) The true bottleneck is the position-embedding lookup table, which at d_model=512 needs 10,000×512=5M parameters; fixes replace learned embeddings with computed encodings like RoPE or ALiBi to remove that memory cost.`,
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
    interactiveId: 'attention_viz',
    interactivePrompt: 'A transformer block is stacked self-attention + feed-forward, repeated N times. Explore the attention step — the core operation the whole block is built around.',
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

[FIGURE: transformer_block]

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
    recap: [
      `**Attention's blind spot — no sense of order:** raw self-attention is permutation-equivariant, so "dog bit man" and "man bit dog" produce the same (reordered) outputs. It sees a *set* of words, not a sequence.`,
      `**Positional encoding fixes it:** add a position-dependent vector to each token's embedding. Sinusoidal encodings (sin/cos at many frequencies) extrapolate to unseen lengths because PE(pos+k) is a linear function of PE(pos); modern models use RoPE, which encodes *relative* position directly in the attention scores and generalises well to longer sequences.`,
      `**The block, in order:** norm → multi-head attention → residual add → norm → feed-forward network (FFN) → residual add. Pre-norm (norm inside the residual branch) is the stable modern default.`,
      `**The FFN is deliberately ~4× wide:** it's the model's *memory* where factual knowledge is stored and retrieved — shrink it and the model measurably forgets facts, even though it's often overlooked next to attention.`,
      `**Residual shortcuts route gradients to every layer at once** — ∂L/∂x keeps a direct identity path back regardless of the block's transform, which is the only reason you can stack dozens of Transformer blocks and still train them.`,
      `**Two flavours:** encoder-only (BERT — bidirectional, both-sides context, best for *understanding* tasks) and decoder-only (GPT — masks future tokens so it can only look left, best for *generation*, and since every token is a training target it gets denser signal per pass).`,
      `**Pre-LN over Post-LN:** every modern large model uses Pre-LN because Post-LN blows up gradient norms early in training and needs careful warmup to survive — a stability property, not a preference.`,
    ],
    checkQuestions: [
      {
        q: `Why does the transformer use positional encodings, and why does standard sinusoidal encoding allow the model to generalise to longer sequences than seen in training?`,
        options: [
          `A) Self-attention operates on the full sequence at once, so it needs explicit position markers. Sinusoidal encoding doesn't beat learned embeddings at generalising — both fail past the training max — but it saves the parameter cost of storing a learned table.`,
          `B) Positional encodings exist because fixed-size attention matrices require every position to share the same embedding dimension. Sinusoidal encoding generalises because its high-frequency components repeat at short, regular wavelengths, giving familiar sub-patterns even at unseen positions.`,
          `C) Self-attention is permutation-equivariant, so it needs an added position-dependent vector per token. Sinusoidal encoding extrapolates because PE(pos+k) is a linear function of PE(pos), unlike learned embeddings with no representation for unseen positions.`,
          `D) Positional encodings compensate for the lack of recurrence, since RNNs encode order through sequential hidden-state updates. Sinusoidal encoding generalises because its frequency bands are tuned to match the natural frequency spectrum of language, independent of sequence length.`,
        ],
        answer: `C`,
      },
      {
        q: `The feed-forward sublayer in a transformer block has two linear layers with a nonlinearity in between: FFN(x) = W₂·ReLU(W₁x + b₁) + b₂. Select the TWO correct statements about its role and 4× width.`,
        options: [
          `A) Attention is fundamentally a linear combination of value vectors, so the FFN supplies the essential nonlinearity; it's applied position-wise (same W₁, W₂ at every position), and 4× expansion (2048 for d_model=512) is empirically robust from BERT to GPT-3.`,
          `B) The 4× expansion functions like a key-value memory: the up-projection selects which sparse "memories" activate in the high-dimensional space, and the down-projection reads their values back out — the source of the FFN's role in storing factual associations.`,
          `C) The FFN provides cross-position communication that attention itself cannot achieve, and 4× width exists specifically to avoid an information bottleneck in mixing tokens across positions — below 4× the model must rely on attention alone for cross-position mixing.`,
          `D) The FFN's real job is normalising attention output magnitude, which would otherwise grow unboundedly with sequence length from summing more values; the 4× width gives the compression back to d_model room to be nonlinear.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why does training a transformer require a learning rate warmup, and what happens without it?`,
        options: [
          `A) Transformer weights start near zero under Xavier/He init; a full learning rate from step 1 overshoots that careful initialisation before the model has seen enough data to correct it, so warmup takes small steps to preserve trainability at depth.`,
          `B) Residual connections create a gradient imbalance at init — layers near the loss get full gradient, early layers get almost none — so full LR makes late layers diverge while early layers barely move; warmup lets early layers accumulate gradient history first.`,
          `C) At step 1, positional encodings are the largest signal in a first-layer input of near-zero random weights, so a full LR immediately overwrites the embedding layer's use of position; warmup lets the model learn to use positional encodings before large updates land.`,
          `D) Adam's second-moment estimates are noisy for the first few batches, so a full LR takes confident steps in unreliable directions. Warmup ramps α from near-zero over 2000-4000 steps so moments settle — without it, transformers often diverge early.`,
        ],
        answer: `D`,
      },
    ],
    figures: {
      transformer_block: `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:300px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">one Transformer block</text>
  <!-- input -->
  <rect x="120" y="28" width="120" height="24" rx="4" fill="var(--prime-faint)" stroke="var(--rim)" stroke-width="1"/>
  <text x="180" y="44" text-anchor="middle" font-size="10" fill="var(--ink-mid)">tokens + positional enc</text>
  <!-- main flow arrow -->
  <line x1="180" y1="52" x2="180" y2="66" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#tb-a)"/>
  <!-- LayerNorm 1 -->
  <rect x="130" y="66" width="100" height="20" rx="4" fill="var(--depth)" stroke="var(--rim)" stroke-width="1"/>
  <text x="180" y="80" text-anchor="middle" font-size="9" fill="var(--ink-hi)">LayerNorm</text>
  <line x1="180" y1="86" x2="180" y2="98" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#tb-a)"/>
  <!-- MHA -->
  <rect x="110" y="98" width="140" height="26" rx="4" fill="var(--prime)" opacity="0.85" stroke="var(--rim)" stroke-width="1"/>
  <text x="180" y="115" text-anchor="middle" font-size="9.5" fill="#000" font-weight="700">Multi-Head Attention</text>
  <!-- add (residual 1) -->
  <line x1="180" y1="124" x2="180" y2="138" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#tb-a)"/>
  <circle cx="180" cy="146" r="9" fill="var(--depth)" stroke="var(--amber)" stroke-width="1.5"/>
  <text x="180" y="150" text-anchor="middle" font-size="11" fill="var(--amber)" font-weight="700">+</text>
  <!-- residual skip 1 (right side) -->
  <path d="M180,60 L300,60 L300,146 L189,146" fill="none" stroke="var(--amber)" stroke-width="1.3" stroke-dasharray="4,3" marker-end="url(#tb-b)"/>
  <text x="306" y="103" font-size="8" fill="var(--amber)" transform="rotate(90,306,103)">residual</text>
  <!-- LayerNorm 2 -->
  <line x1="180" y1="155" x2="180" y2="168" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#tb-a)"/>
  <rect x="130" y="168" width="100" height="20" rx="4" fill="var(--depth)" stroke="var(--rim)" stroke-width="1"/>
  <text x="180" y="182" text-anchor="middle" font-size="9" fill="var(--ink-hi)">LayerNorm</text>
  <line x1="180" y1="188" x2="180" y2="200" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#tb-a)"/>
  <!-- FFN -->
  <rect x="110" y="200" width="140" height="30" rx="4" fill="var(--prime)" opacity="0.6" stroke="var(--rim)" stroke-width="1"/>
  <text x="180" y="214" text-anchor="middle" font-size="9.5" fill="var(--ink-hi)" font-weight="700">Feed-Forward (4× wide)</text>
  <text x="180" y="225" text-anchor="middle" font-size="7.5" fill="var(--ink-mid)">stores factual knowledge</text>
  <!-- add (residual 2) -->
  <line x1="180" y1="230" x2="180" y2="244" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#tb-a)"/>
  <circle cx="180" cy="252" r="9" fill="var(--depth)" stroke="var(--amber)" stroke-width="1.5"/>
  <text x="180" y="256" text-anchor="middle" font-size="11" fill="var(--amber)" font-weight="700">+</text>
  <path d="M180,162 L60,162 L60,252 L171,252" fill="none" stroke="var(--amber)" stroke-width="1.3" stroke-dasharray="4,3" marker-end="url(#tb-b)"/>
  <text x="54" y="207" font-size="8" fill="var(--amber)" transform="rotate(-90,54,207)">residual</text>
  <!-- output -->
  <line x1="180" y1="261" x2="180" y2="274" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#tb-a)"/>
  <text x="180" y="290" text-anchor="middle" font-size="9" fill="var(--ink-low)">to next block ×N</text>
  <defs>
    <marker id="tb-a" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--ink-low)"/></marker>
    <marker id="tb-b" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--amber)"/></marker>
  </defs>
</svg>`,
    },
  },
  {
    id: 'pretraining',
    title: 'Pre-training & Transfer Learning',
    subtitle: 'Masked LM, causal LM, BERT vs GPT objectives, feature extraction vs fine-tuning',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['pre-training', 'transfer learning', 'BERT', 'GPT', 'fine-tuning'],
    summary: `The Transformer module closed on architecture — how attention, residuals, and Pre-LN normalisation combine into a stable, stackable block. None of that explains how the *weights inside* that architecture come to know anything about language before you've trained them on your task at all. That's a separate question, and it's the one this module answers.

You have 500 labelled radiology reports and need to classify them by findings. Train a model from scratch on those 500, and it has to learn *everything* at once — what "pulmonary" means, that "nodule" is worrying, that "no evidence of" flips the meaning, *and* the actual classification rule — all from 500 examples. It ends up memorising quirks that do not generalise, and test AUC lands at a dismal **0.61.**

Now do one thing differently: start from **PubMedBERT**, a model already trained on 14 million medical papers, and fine-tune it on the *same* 500 reports. Test AUC: **0.87.** Nothing about your labels or task changed. What changed is the *starting point* — PubMedBERT already knows medical language, so your 500 labels only have to teach it the final decision, not the entire vocabulary. This is **transfer learning**, and it is one of the highest-leverage ideas in modern ML.

---

**What pre-training actually does.**

Picture the model's millions of weights as coordinates on a vast, foggy mountain range, where height measures how badly the model performs at language and low valleys are where it performs well. Training from scratch is being dropped at a *random* point in that fog with only 500 tries — 500 fine-tuning steps — to feel your way toward a good valley; 500 tries barely gets you off the plateau you happened to land on, which is exactly why the from-scratch radiology model stalled at 0.61.

Pre-training is a helicopter ride to a known region of that range before you ever start hiking. You take a mountain of unlabelled text and make the model play fill-in-the-blank or predict-the-next-word, billions of times — this is *self-supervised* learning, since the "labels" (the missing or next word) come free from the text itself. To get good at that game the model is forced to internalise how language works — grammar, vocabulary, which words go together, domain structure — and all of that gets baked into its weights as coordinates, landing it at a "base camp" a short hike from a huge number of good valleys, including yours. Fine-tuning is that short hike: your 500 examples only have to nudge the model from base camp to the *particular* valley your task needs, not search the whole foggy range from a random drop point.

[FIGURE: transfer_flow]

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
        q: `BERT masks 15% of tokens and predicts them. Why 15% and not 50% or 1%? Explain the tradeoff. Select the TWO correct statements.`,
        options: [
          `A) Too low (1%): only ~1 masked token per 100, so most of the forward pass gives no prediction signal and training is very slow. Too high (50%): so much context is gone that prediction becomes nearly impossible, diverging from the full-context understanding needed downstream.`,
          `B) Within the 15%, BERT uses an 80/10/10 split — 80% [MASK], 10% random token, 10% unchanged — so the model doesn't learn that [MASK] is special and still represents unmasked tokens well at inference, where [MASK] never appears.`,
          `C) 15% is the theoretical information-theoretic optimum: masking 15% of a 512-token sequence gives exactly 76.8 masked tokens, matching the ~30,000-token vocabulary at the ratio required for balanced per-token learning.`,
          `D) 15% was chosen to match the typical out-of-vocabulary token rate seen in early NLP benchmarks, so BERT learns to handle unknown-token positions robustly in a way that transfers directly to specialised downstream vocabularies.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `GPT is trained with causal (autoregressive) language modelling, BERT with masked language modelling. Which is better for generation, and why can't you use BERT for generation directly?`,
        options: [
          `A) BERT is actually better for generation since bidirectional context yields higher-quality representations — it "knows" what comes after each token. Its only limitation is generating tokens all at once via iterative mask-and-predict passes instead of sequentially, one at a time.`,
          `B) Both models generate text equally well, but GPT does left-to-right naturally while BERT can generate right-to-left via iterative masking, producing grammatically correct but stylistically different output — the choice depends on task direction.`,
          `C) Neither pretrained model can generate coherent text without supervised fine-tuning on (prompt, response) pairs; GPT is typically chosen for that fine-tuning only because its objective is nominally closer to generation.`,
          `D) GPT predicts each token from only prior tokens — exactly generation's structure — while BERT's bidirectional attention needs future tokens that don't exist yet, and its [MASK]-filling objective has no left-to-right mechanism.`,
        ],
        answer: `D`,
      },
      {
        q: `What is catastrophic forgetting in neural networks, and why does it make sequential fine-tuning on multiple tasks difficult?`,
        options: [
          `A) It is the loss of gradient information over very long runs — after thousands of steps, the optimizer's momentum and second-moment estimates drift from the current gradient direction, and sequential fine-tuning compounds this because each new task resets the optimizer state.`,
          `B) It occurs when weight magnitudes grow too large during training, saturating sigmoid/tanh activations and making the network insensitive to new inputs; each new task in a sequence pushes magnitudes further, degrading performance on all prior tasks.`,
          `C) Weights updated for task B overwrite the weights encoding task A's knowledge, since gradient descent on task B's loss has no constraint protecting task A's optimum. Mitigations: replay, elastic weight consolidation.`,
          `D) It is a hardware memory-management problem — GPU memory holding task A's optimizer state gets overwritten by task B's training process; the fix is task-isolated CUDA streams staging each task's updates separately before applying them to shared weights.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Pre-training changes the optimization starting point, not just the weight scale — it places the model in a loss basin near representations that generalize, which is why 500 fine-tuning examples produce a 26-point AUC gain that no amount of regularization from random initialization can replicate.`,
    recap: [
      `**Picks up from Transformers:** that module covered architecture (attention + residuals + Pre-LN); this one covers what makes the *weights* inside that architecture already know language before your task even starts.`,
      `**Transfer learning payoff:** 500 radiology reports trained from scratch reach AUC 0.61; the *same* 500 examples fine-tuning PubMedBERT reach 0.87 — a 26-point gain where only the *starting point* changed, not the data. No amount of regularisation from random init replicates it.`,
      `**Mountain-range metaphor:** weights = coordinates, height = how badly the model performs. From-scratch training is a random drop in the fog with only 500 tries to find a good valley (why it stalled at 0.61). Pre-training is a helicopter ride to a "base camp" already near many good valleys.`,
      `**Pre-training is self-supervised:** the model does fill-in-the-blank (masked) or next-word prediction on a mountain of *unlabelled* text — labels come free from the text itself — which forces it to internalise grammar, facts, and structure into its weight-coordinates before it ever sees your task.`,
      `**Fine-tuning is the short hike from base camp,** not a fresh search from a random drop — it moves the weights only a little toward the one valley your task needs, which is why a few hundred labelled examples suffice.`,
      `**Two pre-training styles:** masked LM (BERT — sees both sides of a token, best for *understanding* tasks) and causal LM (GPT — predicts the next word, gives denser signal since every token is a target, best for *generation*).`,
      `**Trap — catastrophic forgetting:** a large learning rate on a small dataset overwrites the very pre-trained knowledge that made the model valuable, dragging it back toward random. The small dataset can't re-teach what a big corpus taught.`,
      `**Safety recipe:** use a learning rate 10–100× smaller than pre-training (~2e-5), few epochs, a short warmup, and weight decay ~0.01 — all to keep the weights *near* the pre-trained basin rather than wandering out of it.`,
      `**Diagnostic:** immediate divergence in the first steps → LR too high, divide by 10; a model that never beats the from-scratch baseline → domain mismatch or a wrong task head, not a tuning issue.`,
    ],
    figures: {
      transfer_flow: `<svg viewBox="0 0 360 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">pre-train once, fine-tune many times</text>
  <!-- big corpus -->
  <rect x="14" y="40" width="84" height="54" rx="5" fill="var(--prime-faint)" stroke="var(--rim)" stroke-width="1"/>
  <text x="56" y="62" text-anchor="middle" font-size="9.5" fill="var(--ink-hi)" font-weight="700">huge</text>
  <text x="56" y="75" text-anchor="middle" font-size="9.5" fill="var(--ink-hi)" font-weight="700">unlabelled</text>
  <text x="56" y="88" text-anchor="middle" font-size="8.5" fill="var(--ink-mid)">corpus (14M)</text>
  <!-- arrow: self-supervised -->
  <line x1="98" y1="67" x2="140" y2="67" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#tf-a)"/>
  <text x="119" y="60" text-anchor="middle" font-size="7.5" fill="var(--ink-low)">self-sup.</text>
  <!-- pretrained model -->
  <rect x="140" y="40" width="90" height="54" rx="5" fill="var(--prime)" opacity="0.85" stroke="var(--rim)" stroke-width="1"/>
  <text x="185" y="62" text-anchor="middle" font-size="10" fill="#000" font-weight="700">pretrained</text>
  <text x="185" y="76" text-anchor="middle" font-size="10" fill="#000" font-weight="700">model</text>
  <text x="185" y="88" text-anchor="middle" font-size="7.5" fill="#000">knows the language</text>
  <!-- three fine-tune branches -->
  <line x1="230" y1="55" x2="272" y2="40" stroke="var(--amber)" stroke-width="1.5" marker-end="url(#tf-b)"/>
  <line x1="230" y1="67" x2="272" y2="97" stroke="var(--amber)" stroke-width="1.5" marker-end="url(#tf-b)"/>
  <line x1="230" y1="79" x2="272" y2="154" stroke="var(--amber)" stroke-width="1.5" marker-end="url(#tf-b)"/>
  <rect x="272" y="28" width="80" height="26" rx="4" fill="var(--depth)" stroke="var(--rim)" stroke-width="1"/>
  <text x="312" y="45" text-anchor="middle" font-size="8.5" fill="var(--ink-hi)">task A: 500 labels</text>
  <rect x="272" y="84" width="80" height="26" rx="4" fill="var(--depth)" stroke="var(--rim)" stroke-width="1"/>
  <text x="312" y="101" text-anchor="middle" font-size="8.5" fill="var(--ink-hi)">task B: 500 labels</text>
  <rect x="272" y="140" width="80" height="26" rx="4" fill="var(--depth)" stroke="var(--rim)" stroke-width="1"/>
  <text x="312" y="157" text-anchor="middle" font-size="8.5" fill="var(--ink-hi)">task C: 500 labels</text>
  <text x="243" y="128" text-anchor="middle" font-size="7.5" fill="var(--amber)">fine-tune</text>
  <text x="180" y="176" text-anchor="middle" font-size="8.5" fill="var(--ink-low)">expensive pre-training amortised across every downstream task</text>
  <defs>
    <marker id="tf-a" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--ink-low)"/></marker>
    <marker id="tf-b" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--amber)"/></marker>
  </defs>
</svg>`,
    },
  },
  {
    id: 'finetune',
    title: 'Fine-Tuning Strategies',
    subtitle: 'Full fine-tune, LoRA, prefix tuning, adapter layers — when each applies',
    difficulty: 'advanced',
    estimatedMin: 29,
    tags: ['fine-tuning', 'LoRA', 'PEFT', 'adapters', 'LLM'],
    summary: `You want LLaMA-2 70B to answer internal questions in your company's tone and format. The brute-force way — **full fine-tuning** — means updating *all 70 billion* weights. Just the bookkeeping (weights, gradients, and Adam's two running averages) needs roughly 14 bytes per parameter — about **980 GB** of GPU memory, a dozen top-end GPUs, days of training, and a real risk of overwriting the very abilities that made the model good. For most teams that is a non-starter.

But look at what actually has to change. Teaching a 70-billion-parameter model your company's tone doesn't require touching what it already knows about grammar, facts, or reasoning — it requires a small, structured *correction* layered on top of what's already there. Picture a sticky note stuck on one page of a huge textbook: you don't retype the page, you leave a small note in the margin, and reading proceeds normally except wherever the note applies. If the correction a task genuinely needs is small and structured, the note can be tiny compared to the page it corrects.

---

**Making that concrete.**

Take one 4096×4096 weight matrix inside the model — 16.7 million numbers. A full update to it would itself be a 4096×4096 matrix: 16.7 million more numbers to learn from your comparatively tiny fine-tuning dataset. But suppose the *correction* that matrix needs can be described by a much narrower structure — the product of two skinny matrices, one 4096×8 and one 8×4096. Multiply them out and you get a full 4096×4096 update, but you only had to *learn* the two skinny factors: 4096×8 + 8×4096 = 65,536 numbers — a 99.6% cut from 16.7 million.

That is the whole trick behind **LoRA** (Low-Rank Adaptation): freeze the giant base model exactly as it is, and train only the two skinny "sticky-note" matrices, B and A. Once trained, the tiny update merges *straight back* into the original weights — new W = W + B·A — so the deployed model is exactly the same size and speed as the original: **zero extra inference cost.** That mergeability is LoRA's edge over "adapter" approaches that bolt on permanent extra modules the model must run through forever.

[FIGURE: lora_decomp]

---

**The next crisis: the frozen base is still huge.**

LoRA already cuts *trainable* parameters by 99.6%. But the frozen base model still has to sit in GPU memory at full size — 70B parameters at 16-bit precision is still about 140GB, more than any single GPU holds. Can the frozen part be shrunk too, without hurting the tiny trainable part's accuracy?

Squash the frozen base down to 4-bit numbers (from ~140GB to ~35GB), and train the small LoRA matrices in full precision on top. Because the base weights are never actually updated — all the learning happens in the little adapters — the rounding error from the 4-bit squashing barely matters to the final result. This combination — a 4-bit frozen base plus full-precision LoRA matrices — is what's called **QLoRA**, and it is what lets a 70B fine-tune fit on a single 80GB GPU, at near-full-fine-tuning quality.

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
        q: `You fine-tune a pre-trained BERT model on a sentiment classification task with 500 labeled examples. What are the risks, and what techniques do you use? Select the TWO correct statements.`,
        options: [
          `A) Risks: catastrophic forgetting from large updates to all 110M weights on a small task, and overfitting since 500 examples is far too few to safely update every layer. Techniques: freeze early layers, use a small LR (1e-5/2e-5) on pre-trained layers, few epochs with early stopping.`,
          `B) Adapters or LoRA on top of a frozen BERT (~0.1% trainable parameters) plus data augmentation (back-translation, synonym replacement to expand 500→~2000 effective examples) sharply reduce both forgetting and overfitting risk versus full fine-tuning.`,
          `C) The primary risk is underfitting, since BERT needs at least 10,000 examples per class to move away from general language modelling; the fix is a much higher learning rate (1e-3) to force aggressive adaptation from the limited data.`,
          `D) With 220,000 parameters per example, the ratio actually favors full fine-tuning rather than risking it, since BERT's pre-trained representations prevent the model from learning noise; the main risk left is underfitting from too small a learning rate.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `LoRA (Low-Rank Adaptation) decomposes weight updates into low-rank matrices: ΔW = BA where B ∈ ℝ^{d×r} and A ∈ ℝ^{r×k}. For d=k=1024 and r=8, how many parameters does LoRA add vs full fine-tuning? Why does this work?`,
          options: [
          `A) LoRA adds 16,384 params (8,192 each for B and A), but still needs gradient tracking through all frozen base weights to compute A/B's gradients — so training memory matches full fine-tuning, with savings appearing only at inference once BA is merged.`,
          `B) LoRA's savings come from targeting only attention matrices (Q,K,V,O), not from low-rank factorisation itself: 12×4×16,384=786,432 updated parameters vs 12×4×1,048,576 for full attention fine-tuning, while FFN layers still get full-rank updates.`,
          `C) Full fine-tuning needs 1,048,576 params per matrix; LoRA needs 8,192(B)+8,192(A)=16,384 — a 64× cut. This works because adaptations empirically have low intrinsic dimensionality, and at inference W'=W+BA merges with zero added latency.`,
          `D) LoRA needs 16,384 params, a 64× cut, but not because of low intrinsic rank — BA is always full-rank with independent random init, so rank-8 can represent any full-rank update. The real benefit is implicit regularisation equivalent to nuclear-norm minimisation.`,
        ],
        answer: `C`,
      },
      {
        q: `When does RLHF (Reinforcement Learning from Human Feedback) improve a language model beyond standard fine-tuning? What is the reward model, and what can go wrong?`,
        options: [
          `A) RLHF helps mainly on verifiable tasks (code execution, math) where an automated checker replaces the reward model and PPO can explore beyond the SFT dataset; on subjective tasks RLHF underperforms SFT since preference data is too noisy for reliable rewards.`,
          `B) RLHF helps when "helpful" can't be reduced to cross-entropy. A reward model trained on human comparisons scores responses, PPO optimises against it. Failure modes: reward hacking, sycophancy, collapsed diversity.`,
          `C) RLHF only helps once a model exceeds 7B parameters, since smaller models' reward models — typically logistic regression on frozen embeddings — can't learn preferences accurately enough for PPO to beat the SFT baseline.`,
          `D) RLHF and SFT are equivalent in expectation, both fitting human-preferred outputs from the same data; RLHF's only real advantage is that PPO needs 10× less annotation, and its failure mode is purely PPO's clipping parameter causing policy divergence.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Task-specific weight updates have low intrinsic rank — LoRA exploits this to fine-tune a 70B model with 0.2% of its parameters, and because BA merges directly into W after training, the deployed model is byte-for-byte identical to the base model with zero inference overhead.`,
    recap: [
      `**Full fine-tuning is brutal:** all 70B weights → ~14 bytes/param ≈ 980GB, a dozen GPUs, and risk of overwriting what made the model good.`,
      `**LoRA insight:** the needed update is low-rank. Learn a 4096×4096 update as two skinny matrices (4096×8, 8×4096) — ~65K numbers, a 99.6% cut. Base model frozen.`,
      `**LoRA merges back into W:** deployed model is same size and speed as the original — zero extra inference cost (its edge over adapters).`,
      `**QLoRA:** squash frozen base to 4-bit (~140GB → ~35GB), train full-precision LoRA on top → 70B fine-tune on one 80GB GPU; rounding error barely matters since base weights never update.`,
      `**Rank guidance:** 8–16 for tone/format/behaviour the model partly knows; 64+ or full fine-tune for genuinely new knowledge.`,
      `**Feature extraction ≠ fine-tuning:** a fresh classifier on a frozen model only re-sorts existing representations; real fine-tuning (incl. LoRA) changes effective weights to learn new behaviour.`,
      `**Diagnostic:** if training loss drops but target behaviour doesn't, the data doesn't actually demonstrate the target behaviour.`,
    ],
    figures: {
      lora_decomp: `<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">LoRA: W frozen, learn a low-rank update</text>
  <!-- frozen W big square -->
  <rect x="24" y="40" width="90" height="90" fill="var(--depth)" stroke="var(--rim)" stroke-width="1"/>
  <text x="69" y="82" text-anchor="middle" font-size="13" fill="var(--ink-mid)" font-weight="700">W</text>
  <text x="69" y="98" text-anchor="middle" font-size="8" fill="var(--ink-low)">4096×4096</text>
  <text x="69" y="146" text-anchor="middle" font-size="9" fill="var(--ink-low)">frozen ❄ (16.7M)</text>
  <!-- plus -->
  <text x="130" y="90" text-anchor="middle" font-size="18" fill="var(--ink-mid)" font-weight="700">+</text>
  <!-- B tall skinny -->
  <rect x="150" y="40" width="18" height="90" fill="var(--prime)" opacity="0.85" stroke="var(--rim)" stroke-width="1"/>
  <text x="159" y="88" text-anchor="middle" font-size="11" fill="#000" font-weight="700">B</text>
  <text x="159" y="146" text-anchor="middle" font-size="8" fill="var(--ink-low)">4096×8</text>
  <!-- times -->
  <text x="182" y="90" text-anchor="middle" font-size="14" fill="var(--ink-mid)" font-weight="700">×</text>
  <!-- A wide short -->
  <rect x="196" y="76" width="90" height="18" fill="var(--amber)" opacity="0.85" stroke="var(--rim)" stroke-width="1"/>
  <text x="241" y="90" text-anchor="middle" font-size="11" fill="#000" font-weight="700">A</text>
  <text x="241" y="112" text-anchor="middle" font-size="8" fill="var(--ink-low)">8×4096</text>
  <!-- equals result -->
  <text x="300" y="90" text-anchor="middle" font-size="16" fill="var(--ink-mid)" font-weight="700">=</text>
  <rect x="314" y="55" width="40" height="60" fill="var(--prime-faint)" stroke="var(--rim)" stroke-width="1"/>
  <text x="334" y="82" text-anchor="middle" font-size="8.5" fill="var(--ink-hi)">ΔW</text>
  <text x="334" y="95" text-anchor="middle" font-size="7" fill="var(--ink-mid)">update</text>
  <!-- trainable bracket -->
  <line x1="150" y1="160" x2="286" y2="160" stroke="var(--prime)" stroke-width="1.5"/>
  <text x="218" y="174" text-anchor="middle" font-size="9" fill="var(--prime)" font-weight="700">only these train — ~65K params (99.6% cut)</text>
  <text x="180" y="192" text-anchor="middle" font-size="8.5" fill="var(--ink-low)">after training, merge B·A back into W → zero extra inference cost</text>
</svg>`,
    },
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

[FIGURE: int8_buckets]

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
        q: `INT8 quantization reduces a weight from float32 (32 bits) to int8 (8 bits). What is the compression ratio, and what information is lost? Select the TWO correct statements.`,
        options: [
          `A) Compression ratio is 32/8 = 4×. Information lost is precision: 256 distinct values span [w_min,w_max] with step (w_max−w_min)/255 — e.g. ~0.004 for a [−0.5,0.5] range — and every weight rounds to the nearest step.`,
          `B) If the weight distribution isn't too wide and outliers are rare, INT8's 256 buckets are sufficient for inference accuracy close to float32, since the rounding error stays small relative to the useful weight range.`,
          `C) INT8 can only represent values from −128 to 127, so information lost is dynamic range rather than precision — any weight whose absolute value exceeds 127 gets clipped to the INT8 maximum, regardless of the weight's actual distribution.`,
          `D) The effective compression is smaller than 4× in practice, since one float32 scale factor per layer adds overhead that drops effective compression to ~3.7×, and the information lost is primarily in backward-pass gradients, which is why INT8 is inference-only.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Post-training quantization (PTQ) vs quantization-aware training (QAT): when do you use each, and what is the typical accuracy difference?`,
        options: [
          `A) PTQ quantizes in minutes using a small calibration set; typical INT8 drop is under 0.5% but INT4 drops 1–3%. QAT fine-tunes with fake quantization, taking longer but recovering most of that loss — use PTQ fast, QAT when INT4-or-below matters.`,
          `B) PTQ and QAT produce identical accuracy at INT8 since 256 levels sit below the model's noise floor; the only difference is speed (PTQ minutes, QAT days), and QAT only matters once you drop to INT4 or INT2.`,
          `C) PTQ is always preferable to QAT because QAT's straight-through estimator biases the gradient during fake-quantized training, converging to different weights than the unquantized model — PTQ avoids this by quantizing only after full-precision convergence.`,
          `D) QAT is always preferable regardless of bit width, recovering 2–5% accuracy even at INT8; PTQ is only used because QAT requires modifying training code to insert fake-quantization nodes, adding engineering complexity.`,
        ],
        answer: `A`,
      },
      {
        q: `Why are activations harder to quantize than weights in a neural network?`,
        options: [
          `A) Activations are computed sequentially during the forward pass, so each layer's quantization error compounds on the previous layer's already-quantized output, while independent weight quantization errors average out rather than accumulating.`,
          `B) Weights are fixed after training so their min/max range is knowable once; activations are input-dependent, and rare outliers force a wide range that starves precision elsewhere — worse in transformer attention logits. Fixes: histogram calibration, SmoothQuant.`,
          `C) Activations have higher dimensionality than weights — a 4096-unit layer's activation vector needs more scale factors than the corresponding weight matrix's simpler per-channel scales, making activation calibration computationally expensive.`,
          `D) Activation functions like ReLU and GELU use floating-point operations that can't be represented exactly in integer arithmetic, while weight matrix multiplication can be replicated exactly in integers — making weight quantization exact and activation quantization only approximate.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Quantization is a calibration problem: the scale factors that map float ranges to integers are only valid for the distribution they were calibrated on — skip calibration or shift the production distribution and the accuracy drop will be silent, with no error and no obvious cause.`,
    recap: [
      `**FP32 = 4 bytes/weight:** GPT-2's 117M weights = 468MB, often too big/slow for a phone.`,
      `**INT8 = 1 byte:** 4× smaller *and* 2–4× faster (CPUs have integer-math hardware).`,
      `**Float → int:** \`x_int = round(x_float / scale)\`, \`scale = (max − min) / 255\` — 256 buckets, rounding is the cost.`,
      `**Outliers are the whole game:** one weight at 5.0 stretches the range, wasting buckets and starving the common weights of precision.`,
      `**Calibrate on real data:** activation ranges are input-dependent, so run 100–1000 representative inputs to set scale factors. This is PTQ — no retraining, minutes, typically <1% loss.`,
      `**Skip calibration → silent accuracy collapse:** no error in the logs. The single most common quantization mistake.`,
      `**Below INT8:** GPTQ/AWQ reach 4-bit at <1% loss; QAT simulates rounding during training for the best accuracy but costs a full retrain.`,
    ],
    figures: {
      int8_buckets: `<svg viewBox="0 0 360 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">FP32 → INT8: 256 evenly spaced buckets</text>
  <!-- GOOD: tight range -->
  <text x="24" y="40" font-size="9.5" fill="var(--prime)" font-weight="700">tight range → precision preserved</text>
  <line x1="30" y1="70" x2="330" y2="70" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="30" y="86" text-anchor="middle" font-size="8" fill="var(--ink-low)">−0.5</text>
  <text x="330" y="86" text-anchor="middle" font-size="8" fill="var(--ink-low)">0.5</text>
  <!-- bucket ticks evenly across full width -->
  <g stroke="var(--rim)" stroke-width="0.6">
    <line x1="60" y1="64" x2="60" y2="76"/><line x1="90" y1="64" x2="90" y2="76"/><line x1="120" y1="64" x2="120" y2="76"/><line x1="150" y1="64" x2="150" y2="76"/><line x1="180" y1="64" x2="180" y2="76"/><line x1="210" y1="64" x2="210" y2="76"/><line x1="240" y1="64" x2="240" y2="76"/><line x1="270" y1="64" x2="270" y2="76"/><line x1="300" y1="64" x2="300" y2="76"/>
  </g>
  <!-- weight dots spread across buckets -->
  <circle cx="72" cy="70" r="3" fill="var(--prime)"/><circle cx="108" cy="70" r="3" fill="var(--prime)"/><circle cx="165" cy="70" r="3" fill="var(--prime)"/><circle cx="222" cy="70" r="3" fill="var(--prime)"/><circle cx="255" cy="70" r="3" fill="var(--prime)"/><circle cx="288" cy="70" r="3" fill="var(--prime)"/>
  <text x="180" y="98" text-anchor="middle" font-size="8" fill="var(--ink-mid)">buckets land on real weights — small rounding error</text>
  <!-- BAD: outlier stretches range -->
  <text x="24" y="128" font-size="9.5" fill="var(--amber)" font-weight="700">one outlier → buckets wasted</text>
  <line x1="30" y1="158" x2="330" y2="158" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="30" y="174" text-anchor="middle" font-size="8" fill="var(--ink-low)">−0.5</text>
  <text x="330" y="174" text-anchor="middle" font-size="8" fill="var(--ink-low)">5.0</text>
  <!-- common weights all crammed near left -->
  <g stroke="var(--rim)" stroke-width="0.6">
    <line x1="60" y1="152" x2="60" y2="164"/><line x1="90" y1="152" x2="90" y2="164"/><line x1="120" y1="152" x2="120" y2="164"/><line x1="150" y1="152" x2="150" y2="164"/><line x1="180" y1="152" x2="180" y2="164"/><line x1="210" y1="152" x2="210" y2="164"/><line x1="240" y1="152" x2="240" y2="164"/><line x1="270" y1="152" x2="270" y2="164"/><line x1="300" y1="152" x2="300" y2="164"/>
  </g>
  <rect x="30" y="150" width="24" height="16" fill="var(--prime)" opacity="0.35"/>
  <circle cx="36" cy="158" r="3" fill="var(--prime)"/><circle cx="42" cy="158" r="3" fill="var(--prime)"/><circle cx="48" cy="158" r="3" fill="var(--prime)"/>
  <circle cx="330" cy="158" r="4" fill="var(--amber)"/>
  <text x="330" y="146" text-anchor="middle" font-size="8" fill="var(--amber)" font-weight="700">outlier</text>
  <text x="180" y="190" text-anchor="middle" font-size="8" fill="var(--ink-mid)">all common weights crushed into 1 bucket → precision destroyed</text>
  <text x="180" y="204" text-anchor="middle" font-size="8" fill="var(--ink-low)">calibration sets the range from real data to avoid this</text>
</svg>`,
    },
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

[FIGURE: batching_throughput]

---

**Dynamic batching: don't wait forever for a full truck.**

Waiting for exactly 32 requests is bad if traffic is slow — early requests sit around. The production fix is *dynamic batching:* set a small deadline, say 5ms, and run whatever has arrived by then. Ten requests? Batch the ten. Forty? Take a batch and queue the rest. You capture most of the batching gain while keeping the wait bounded. Every serving framework (vLLM, TGI, ONNX Runtime) does this with one config flag.

---

**Generation has a second problem batching can't fix.**

When an LLM writes a reply one token at a time, producing token number *t* means paying attention to all *t−1* tokens before it. Do this naively and every new token re-computes the attention for every earlier token — the total work grows like n², so a long reply gets punishingly slow near the end.

The fix is the **KV cache.** The first time you process a token, you compute its attention "key" and "value" and *save them.* Every later token just reuses the saved keys and values instead of recomputing them — the work drops from n² to n. For a 512-token reply that is roughly a 512× cut in attention compute. The cost is memory: those saved tensors pile up with every token and every concurrent user. For LLaMA-7B a single token's cache is ~524 KB, so a 512-token chat holds ~256 MB — and an 80 GB A100 (model already loaded) fits only ~300 such chats before it has to start queuing. This is why long context is expensive: the cache, not the weights, runs you out of memory.

---

**One more generation bottleneck: every token, even the easy ones, pays for a full pass.**

Even with the KV cache, generating text one token at a time means paying for a full forward pass through the *big* model for every single token — including the easy, predictable ones ("of," "the," a comma most sentences obviously need). Most of any sentence is exactly that predictable. What if a much smaller, much cheaper model guessed the next few tokens, and the big model only had to *check* those guesses instead of generating each one from scratch?

That's the move: let a small, fast "draft" model guess the next K tokens, then have the big model verify all K *in a single forward pass* — which costs about the same as generating one token, because checking K candidate tokens in parallel is no more expensive than one pass's worth of compute. This is **speculative decoding**. When the draft guessed right, you got K tokens for the price of one — typical speedups are 2–3×. Wherever the draft guessed wrong, the big model's own prediction at that position is used instead, so correctness is never traded away, only speed. The whole theme of serving: the bottleneck is almost never raw model size — it is how well you keep the GPU full through batching, caching, and quantization.`,
    keyPoints: [
      `**Implement dynamic batching before any other optimization — it is the single highest-leverage change for throughput, often 10–30× improvement with zero accuracy cost.**\n\nThe math is simple: at batch size 1, GPU utilization on a typical LLM inference workload is 5–15%. At batch size 32, it is 60–80%. Matrix multiply FLOP/byte ratio scales with the batch dimension — larger batches use the GPU's memory bandwidth more efficiently. Every serving framework (vLLM, TGI, ONNX Runtime) implements dynamic batching; enabling it takes one configuration flag.`,
      `**Trap: KV cache grows linearly with sequence length — at long context (16K+ tokens), KV cache can exceed model weight memory. Set max_sequence_length based on actual P99 request lengths, not the theoretical maximum.**\n\nFor LLaMA-7B with 16K context: KV cache per request = 524KB/token × 16,384 tokens = 8.3GB. On an 80GB A100 with ~60GB available after model weights, that supports 7 concurrent requests at 16K context — versus 200+ at 512 tokens. Profile your actual P99 sequence length from traffic logs before configuring context limits. Allowing 16K context for a workload whose P99 is 1K wastes 16× the KV memory.`,
      `**Diagnostic: profile GPU utilization during serving. If under 60%, you are under-batching. If over 95% with high latency, you have over-batched or the model is too large for your SLA — consider quantization or a smaller model.**\n\nNVIDIA's \`nvidia-smi dmon\` gives per-second GPU utilization. Under-batching (low utilization) and over-batching (high utilization, high latency) have opposite fixes. The target operating point is 70–85% utilization at your P99 latency budget. Below that: increase max batch size or reduce batch timeout. Above that: add more GPUs, quantize to reduce per-request compute, or use a smaller model.`,
    ],
    interactivePrompt: `Before you touch the controls: if generating a 100-token response without KV cache requires computing the full attention matrix at each of the 100 steps, how does the total attention compute compare to the same generation with KV cache enabled?`,
    checkQuestions: [
      {
        q: `A transformer model has 175B parameters in FP16. How much GPU memory is required for model weights alone? How many A100 80GB GPUs do you need? Select the TWO correct statements.`,
        options: [
          `A) 175B × 2 bytes (FP16) = 350GB for weights alone; one 80GB A100 can't fit it, needing ceil(350/80)=5 GPUs minimum just for weights.`,
          `B) Inference also needs activations and KV cache: a batch of 32 sequences at 2048 tokens with 96 layers, d_model=12288 needs roughly 300GB of KV cache — pushing the realistic total to ~650GB, i.e. ~9 A100s, so deployments typically use 8× A100 FP16 or 4× A100 with INT8 weights.`,
          `C) FP16 requires storing both the weights and an FP32 master copy for precision even at inference, so real memory need is 350GB×1.5=525GB, requiring at least 7 GPUs for weights alone.`,
          `D) Tensor-parallel sharding needs 2× overhead for cross-GPU communication buffers, so effective memory per GPU is 350GB×2/n; at n=8 that's 87.5GB per GPU, over the 80GB limit, requiring 16 GPUs minimum.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Batching requests increases GPU utilization but increases latency. How does dynamic batching work, and what is the p99 latency problem?`,
        options: [
          `A) Dynamic batching groups by predicted output length so batch members finish together, eliminating the static-batching wait; the p99 problem is mostly avoided except for occasional length-prediction misses.`,
          `B) Dynamic batching pre-allocates a fixed batch size and pads shorter requests with zeros until full; p99 latency suffers because padding wastes compute, and 99th-percentile requests pay a disproportionate cost aligning to the batch's longest member.`,
          `C) Dynamic batching groups requests by input length to minimise attention-mask padding, since output length can't be known in advance; p99 latency suffers from systematic queuing as short requests wait behind similar-length ones.`,
          `D) The system waits a short window (10ms), batches whatever arrived, for better FLOP/byte efficiency. p99 suffers because SLAs target p99/p95, not mean — an unlucky request pays the full wait plus generation time. Fix: continuous batching.`,
        ],
        answer: `D`,
      },
      {
        q: `KV-cache stores key and value tensors from previous tokens to avoid recomputation during autoregressive generation. How does it save computation, and what is its memory cost for GPT-3 (175B) generating a sequence of length 1000?`,
        options: [
          `A) Without caching, generating token t recomputes K,V for all t-1 prior tokens — O(t) per token, O(t²) total; caching drops this to O(t). GPT-3 stores ~4.5MB/token, so 1000 tokens costs ~4.5GB — the dominant memory cost.`,
          `B) KV-cache saves computation by skipping softmax recomputation via an incremental update rule; memory cost is estimated as 2×175B×2bytes×(seq_len/model_dim) ≈ 28GB per sequence, needing 4 A100s just for one sequence's cache.`,
          `C) KV-cache eliminates recomputing the full seq_len×seq_len attention matrix at each step, needing only the new token's scores; the attention matrix itself for 1000 tokens is only ~384MB per sequence and isn't a real bottleneck.`,
          `D) KV-cache trades computation for memory by caching Q,K,V projections so only Q needs recomputation each step, a 3× compute saving; memory cost works out to ~4.7GB per sequence for GPT-3 at 1000 tokens.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Throughput and latency are opposing objectives — batching 32 requests gives 32× throughput but adds queuing time, and KV cache gives 512× compute reduction for generation but consumes memory that limits concurrency — optimize for one explicitly before touching model size or architecture.`,
    recap: [
      `**One request at a time wastes the GPU:** 50ms/pass = 20 req/s, GPU 95% idle. A GPU wants thousands of multiplies at once.`,
      `**Batching = fill the truck:** 32 requests in one pass finish in ~the same 50ms → 640 req/s, no model change. The biggest serving lever.`,
      `**Dynamic batching:** set a small deadline (~5ms), run whatever arrived — most of the gain, bounded wait. One config flag in vLLM/TGI/ONNX.`,
      `**KV cache fixes generation's n² problem:** save each token's key/value, reuse them → work drops n² → n (~512× for a 512-token reply).`,
      `**KV cache cost is memory:** ~524KB/token for LLaMA-7B → ~256MB per 512-token chat; an 80GB A100 fits only ~300 chats. Long context runs you out of memory — the cache, not the weights.`,
      `**Speculative decoding:** small draft model guesses K tokens, big model verifies all K in one pass → 2–3× when the guess is right.`,
      `**Diagnostic:** target 70–85% GPU utilization at P99 budget — under 60% = under-batching; over 95% with high latency = over-batched or model too big.`,
    ],
    figures: {
      batching_throughput: `<svg viewBox="0 0 360 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">batching fills an idle GPU</text>
  <!-- no batching -->
  <text x="90" y="36" text-anchor="middle" font-size="9.5" fill="var(--ink-mid)" font-weight="700">1 request / pass</text>
  <rect x="30" y="44" width="120" height="70" rx="4" fill="var(--depth)" stroke="var(--rim)" stroke-width="1"/>
  <text x="90" y="42" text-anchor="middle" font-size="7" fill="var(--ink-low)">GPU</text>
  <!-- one filled cell of many -->
  <rect x="38" y="52" width="16" height="16" fill="var(--prime)" opacity="0.85"/>
  <g fill="var(--rim)" opacity="0.4">
    <rect x="58" y="52" width="16" height="16"/><rect x="78" y="52" width="16" height="16"/><rect x="98" y="52" width="16" height="16"/><rect x="118" y="52" width="16" height="16"/>
    <rect x="38" y="72" width="16" height="16"/><rect x="58" y="72" width="16" height="16"/><rect x="78" y="72" width="16" height="16"/><rect x="98" y="72" width="16" height="16"/><rect x="118" y="72" width="16" height="16"/>
    <rect x="38" y="92" width="16" height="16"/><rect x="58" y="92" width="16" height="16"/><rect x="78" y="92" width="16" height="16"/><rect x="98" y="92" width="16" height="16"/><rect x="118" y="92" width="16" height="16"/>
  </g>
  <text x="90" y="130" text-anchor="middle" font-size="8" fill="var(--ink-low)">95% idle</text>
  <text x="90" y="146" text-anchor="middle" font-size="11" fill="var(--ink-hi)" font-weight="700">20 req/s</text>
  <!-- arrow -->
  <line x1="158" y1="80" x2="200" y2="80" stroke="var(--amber)" stroke-width="2" marker-end="url(#bt-a)"/>
  <text x="179" y="72" text-anchor="middle" font-size="7.5" fill="var(--amber)">batch 32</text>
  <!-- with batching: full grid -->
  <text x="270" y="36" text-anchor="middle" font-size="9.5" fill="var(--ink-mid)" font-weight="700">32 requests / pass</text>
  <rect x="210" y="44" width="120" height="70" rx="4" fill="var(--depth)" stroke="var(--rim)" stroke-width="1"/>
  <g fill="var(--prime)" opacity="0.85">
    <rect x="218" y="52" width="16" height="16"/><rect x="238" y="52" width="16" height="16"/><rect x="258" y="52" width="16" height="16"/><rect x="278" y="52" width="16" height="16"/><rect x="298" y="52" width="16" height="16"/>
    <rect x="218" y="72" width="16" height="16"/><rect x="238" y="72" width="16" height="16"/><rect x="258" y="72" width="16" height="16"/><rect x="278" y="72" width="16" height="16"/><rect x="298" y="72" width="16" height="16"/>
    <rect x="218" y="92" width="16" height="16"/><rect x="238" y="92" width="16" height="16"/><rect x="258" y="92" width="16" height="16"/><rect x="278" y="92" width="16" height="16"/><rect x="298" y="92" width="16" height="16"/>
  </g>
  <text x="270" y="130" text-anchor="middle" font-size="8" fill="var(--ink-low)">GPU saturated</text>
  <text x="270" y="146" text-anchor="middle" font-size="11" fill="var(--prime)" font-weight="700">640 req/s</text>
  <text x="180" y="176" text-anchor="middle" font-size="8.5" fill="var(--ink-mid)">same 50ms per pass, same hardware — 32× throughput, no model change</text>
  <defs>
    <marker id="bt-a" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--amber)"/></marker>
  </defs>
</svg>`,
    },
  },
  {
    id: 'dl_debugging',
    title: 'DL Training Failure Modes',
    subtitle: 'Loss spikes, NaN gradients, mode collapse, underfitting vs overfitting — debugging',
    difficulty: 'advanced',
    estimatedMin: 29,
    tags: ['debugging', 'training failures', 'NaN gradients', 'mode collapse'],
    summary: `Model Serving assumed you already had a correctly trained model to deploy. This module is what happens before that assumption is even true.

You start training a new model and the loss just sits there — stuck at log(number of classes), epoch after epoch. The natural instinct is to start turning knobs: a different learning rate, a bigger model, more data. Resist it.

Think of it like an ER doctor's first sixty seconds with a patient: before asking about the specific complaint, check pulse and breathing — the two or three cheap vital signs that rule out the fastest, most catastrophic explanations. A model has its own vital signs, and checking them costs about as little. Before asking "why won't it learn what I want," ask the more basic question: *can this model learn anything at all?* Almost every training bug is easier to catch by answering that first.

---

**Step 1: overfit a single batch.**

Take one batch. Turn off all regularization. Train on just that one batch for a thousand steps. A working model *must* be able to memorize a handful of examples — the loss should crash to near-zero. If it can't even do that, no hyperparameter will save you; the model is wired wrong. Usual suspects: the loss doesn't match the output (softmax paired with MSE, or cross-entropy fed raw logits), the output layer has the wrong number of classes, the labels are the wrong shape, or a forward-pass bug is zeroing activations. This test takes 60 seconds and rules out every one of those at once. It is the single most valuable habit in debugging deep nets.

---

**Step 2: if that passes but full training won't converge, look at gradient flow.**

The signal is learning, but maybe it isn't reaching every layer. Log the average gradient size for each layer after a step. In a healthy network the biggest and smallest layer gradients stay within ~10× of each other. See 10,000× instead and the early layers are getting almost nothing — **vanishing gradients** — and they will not learn no matter how long you train; the fix is ReLU, residual connections, or better initialization, not more epochs. The reverse — early layers with huge gradients — is **exploding gradients:** clip them (max_norm=1.0) and check your initialization.

---

**Watch both vital-sign checks catch real bugs on one model.**

Say you're training a small binary classifier — malicious versus benign network traffic — with a 2-unit softmax output and cross-entropy loss. Step 1 shows loss at log(2) ≈ 0.693; step 50 still shows 0.693, unmoved. Following the diagnostic above: the single-batch overfit test also sits frozen at 0.693. You inspect the logits directly across steps on the same fixed input and they never change at all — the output layer is receiving zero gradient. The cause, once you look: the code calls .detach() on the logits before computing the loss, silently cutting the backward pass off at the very last layer. Remove the .detach() call, rerun the single-batch test — loss now crashes to 0.02 in under 200 steps, exactly as the diagnostic predicts for a correctly wired model.

Rerun full training with the fix in place. Loss falls smoothly from 0.693 toward 0.41 over the first few epochs — then, at step 47, it reports NaN. Looking at the gradient norm logged just before the spike: 8.2 two steps earlier, 41.6 one step earlier, then NaN. That is exploding gradients, not corrupted data — the norm was climbing steadily before it overflowed. Adding gradient clipping (clip_grad_norm_, max_norm=1.0) and rerunning: loss now decreases cleanly to 0.19 by epoch 10, no NaN. Two classic failures, one model, one continuous debugging session — not two abstract rules to memorise separately.

A shorter pair worth knowing by the same two-question habit: training loss falling steadily while validation loss stays flat usually means train and validation don't come from the same distribution, or a decision threshold hasn't been tuned on validation data at all. And a NaN that shows up specifically inside a custom loss, rather than from an exploding gradient norm, is often a bare log(0) — add a small ε inside the log before trusting the gradient math further.

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
          `A) NaN means the exact batch at step 47 triggered it. The only step needed is to reproduce that batch (fixed seed), inspect it for outliers, and drop it — most transformer NaNs come from corrupted data batches, not architecture or hyperparameters.`,
          `B) Order: reduce LR 10×, check inputs for NaN (log(0), div-by-zero), enable gradient clipping (max_norm=1.0), add epsilon to any log/division in custom losses. Most common cause: FP16 overflow in unscaled attention softmax, or missing warmup.`,
          `C) NaN always propagates backward from the final layer, so check the output activation/loss compatibility first, then insert NaN checks layer by layer from output to input until you find the first NaN-producing layer — an incompatible loss-activation pairing is the usual culprit.`,
          `D) NaN always comes from division by zero inside normalisation layers, so adding epsilon=1e-7 to every LayerNorm/BatchNorm/attention denominator resolves essentially all transformer NaN losses; anything left over is a data problem, not architectural.`,
        ],
        answer: `B`,
      },
      {
        q: `Your model achieves 99% training accuracy but 51% test accuracy (near-random for binary classification). What is happening, and what are the top 3 most likely causes? Select the TWO correct causes.`,
        options: [
          `A) Target leakage — a training feature directly encodes the label (row ID, timestamp correlated with class) — memorised perfectly in training but absent or different at test time. Diagnose by training a single-feature model per feature; near-100% accuracy alone flags the leak.`,
          `B) Data preprocessing leakage — scaling, encoding, or imputation fit on the full dataset before splitting lets test-set statistics leak into training. Correct fix: fit all preprocessing on train only, then apply to test.`,
          `C) The model converged to a degenerate solution outputting one class for everything, caused by too many residual layers whose skip connections trivially learn the identity function instead of the task.`,
          `D) The training set is 99% one class, so the model hits 99% training accuracy by always predicting it, while a balanced test set makes that same behaviour land near 50% — fixed with class-balanced sampling or a weighted loss.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Validation loss oscillates rather than decreasing monotonically. You're using SGD+momentum with lr=0.01 and batch size 64. List three possible causes and fixes.`,
        options: [
          `A) LR too high (bounces between nearby losses — fix: reduce 2-5×); validation set too small (high-variance estimate — fix: more data or a moving average); momentum too high (overshoots curvature — fix: lower β to 0.8-0.85).`,
          `B) Oscillating validation with smoothly falling training loss always means overfitting, never an optimisation issue — fix all three at once: dropout p=0.3, weight decay 0.01, and data augmentation; lr and momentum are irrelevant here.`,
          `C) Oscillation means the model alternates between two configurations because β=0.9 momentum causes it to bounce between nearby gradient directions on symmetric saddle points — fix: switch to Adam, whose adaptive rates prevent this saddle-driven oscillation.`,
          `D) At batch size 64, some batches happen to resemble the validation set and temporarily inflate validation performance — fix: stratified batch sampling so every batch matches the overall class distribution, removing the spurious fluctuation.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Overfit one batch first, then log gradient norms per layer — these two tests diagnose 80% of training failures in minutes, before touching hyperparameters or architecture, because a model that cannot learn one example has a bug, not a tuning problem.`,
    recap: [
      `**Picks up from Model Serving:** that module assumed a correctly trained model; this one is what happens before that assumption holds. ER-doctor metaphor: check pulse and breathing (cheap vital signs) before diagnosing the specific complaint.`,
      `**Before "why won't it learn what I want," ask "can it learn anything at all?"** Most bugs surface there first — resist turning knobs.`,
      `**Step 1 — overfit one batch:** turn off regularisation, train on one batch for 1000 steps; a working model must crash to near-zero loss.`,
      `**If it can't:** loss/output mismatch (softmax+MSE, cross-entropy on raw logits), wrong class count, wrong label shape, or a forward-pass bug. 60-second test rules them all out.`,
      `**Step 2 — gradient flow:** log per-layer average gradient; healthy layers stay within ~10× of each other. 10,000× = vanishing (fix: ReLU, residuals, init); huge early gradients = exploding (clip max_norm=1.0).`,
      `**One worked trace, two bugs, one model:** loss frozen at log(2)=0.693 → logits never change → a stray \`.detach()\` was cutting the backward pass; fixed, single-batch loss crashes to 0.02. Rerun full training → NaN at step 47, gradient norm 8.2→41.6→NaN just before → exploding gradients, not data; \`clip_grad_norm_(max_norm=1.0)\` fixes it, loss reaches 0.19 by epoch 10.`,
      `**Shorter pair:** train falling but val flat → distribution mismatch or an untuned threshold; NaN from a custom loss (not an exploding norm) → bare \`log(0)\`, add ε.`,
      `**The trap:** a falling loss doesn't mean it works — always-predict-majority hits 95% accuracy on imbalanced data. Check predictions, confusion matrix, and gradient norms (~0.001–10).`,
    ],
  },
]
