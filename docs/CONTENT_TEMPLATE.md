# MSL Content Template — PAL Voice Standard

_This is the canonical reference for writing and rewriting MSL foundation modules. All modules must conform to this standard. Read before touching any foundation data file._

---

## The Core Principle

MSL content occupies the gap between shallow tutorials ("here is the formula") and academic papers (dense notation, no intuition). The product teaches engineers to think **causally** — to explain any concept to a VP and do a technical deep dive in the same conversation.

The content voice is called **PAL voice**. Every module is a guided story, not a reference entry.

---

## Module Schema

```js
{
  id: 'module_id',
  interactiveId: 'component_id',        // which interactive to render
  interactivePrompt: `...`,             // "Before you touch the controls..." question
  title: 'Human-Readable Title',
  subtitle: 'key subtopic, key subtopic, key subtopic',
  difficulty: 'foundational',           // foundational | intermediate | advanced
  estimatedMin: 25,
  tags: ['tag1', 'tag2'],
  summary: `...`,                       // PAL-voice narrative — see below
  keyPoints: [ `...`, `...`, `...` ],  // exactly 3 items: "The Move"
  takeaway: `...`,                      // one crisp sentence
  checkQuestions: [                     // MCQ format
    {
      q: `...`,
      options: [`\`A) ...\``, `\`B) ...\``, `\`C) ...\``, `\`D) ...\``],
      answer: `A`,
    }
  ],
}
```

---

## The `summary` Field — PAL Voice Narrative

### Rule 1: Open with the problem, not the definition

Wrong:
> "Gradient descent is an iterative optimization algorithm that minimizes a loss function by updating parameters in the direction of the negative gradient."

Right:
> "You have 500,000 parameters and a loss of 2.34. You need to lower it. But you cannot try every combination of parameters — the search space has more configurations than atoms in the universe. Grid search at even 10 values per parameter would require 10^500,000 function evaluations. You need a smarter strategy."

The opening sentence should describe what breaks without this concept — the pain it solves.

### Rule 2: One running example, never dropped

Choose a single concrete, memorable example at the start. Every mechanism introduced must connect back to that example. Never introduce an abstract "consider input X" mid-narrative.

Good examples for common topics:
- Gradient descent: 500,000-parameter network, loss = 2.34
- Decision trees: predicting loan default, 3 features: income, debt, age
- Regularization: linear model on 100 features predicting house prices
- Backprop: 3-layer network, computing gradient of final loss w.r.t. first layer weights
- Attention: translating "The cat sat on the mat" — which words should "sat" attend to?

### Rule 3: Earn each mechanism before naming it

Wrong:
> "We use the chain rule to compute gradients through multiple layers."

Right:
> "To adjust the first-layer weights, you need to know how a small change there ripples through two more layers to affect the final loss. You can trace the path: change in w₁ → change in h₁ → change in h₂ → change in loss. Each arrow in that chain is just a derivative — and the product of derivatives along the path gives the gradient you need. This is the chain rule, applied recursively. It gets the name backpropagation because the gradient flows backward from loss to inputs."

### Rule 4: Include a NOT-this section

Every module must have a paragraph that explicitly names the most common wrong intuition and dismantles it. Format:

> **NOT this.** Most people think [...]. Actually, [...]. The confusion comes from [...].

Examples:
- "NOT this. Most people think L1 regularization 'prefers' sparse solutions because of some penalty math. Actually, sparsity comes from geometry — the L1 constraint region is a diamond with corners on the axes. When you expand a loss contour outward from the origin, you almost always hit a corner first. Smooth constraint regions (L2 spheres) have no corners, so both weights survive."
- "NOT this. Most people think SGD is just 'noisier gradient descent.' The noise is not a bug — it is doing regularization work. Noisy gradient updates explore the loss landscape and preferentially escape sharp minima (narrow basins). Large-batch training converges to sharper minima that generalize worse — the noise was doing implicit regularization all along."

### Rule 5: Formal definition comes late

After the intuition is established, crystallize it in a box:

> **Formally:** $ θ_{t+1} = θ_t - α ∇L(θ_t) $

Or inline in backtick-equation format:

> The update rule is $θ_{t+1} = θ_t − α ∇_θ L(θ_t)$, where α is the learning rate and the gradient $∇_θ L$ gives the direction of steepest ascent in loss space.

### Rule 6: Inline figures at visual arguments

When the narrative hits a visual argument — geometry, a trajectory, a diagram — draw it there in the text as an SVG or inline figure. Do not defer visuals to a separate "visualization" section.

Good visual moments:
- L1 vs L2 geometry: diamond vs circle constraint with expanding loss contours
- Learning rate: 1D parabola showing too-large (oscillates), too-small (creeps), just-right (converges)
- SGD trajectory: 2D contour with noisy path vs smooth GD path
- Decision boundary: scatter plot with separating hyperplane
- Attention: matrix heatmap of attention weights
- PCA: data cloud with first/second principal component arrows

**How to embed an inline figure:** use the `inlineFigure` marker pattern in the summary string:

```
... [FIGURE: l1_l2_geometry — diamond vs circle with expanding loss ellipses] ...
```

The renderer will look up this ID in the module's `figures` array (if provided) or show a placeholder. Keep the figure description precise enough that a developer can build it.

### Summary Length

Target: **400–700 words**. Long enough for a story, short enough to not be a textbook.

---

## The `keyPoints` Field — "The Move"

Exactly **3 items**. Each item = one production-actionable insight.

Format per item:
```
`**Bold headline (10-15 words).**\n\nOne to three sentences that explain what to actually do, when to do it, and why it matters in production. Include a concrete number, threshold, or heuristic where possible.`
```

"The Move" means: if you read only this, you leave with something you can do at work tomorrow. Not vocabulary. Not theory. Actions.

Bad keyPoint (reference-y):
> "L1 regularization uses the L1 norm of the weight vector as a penalty term."

Good keyPoint (The Move):
> "**Use L1 when you need the model to tell you which features matter.** L1 zeros out irrelevant weights, turning feature selection and model training into a single step. When you have 200 candidate features and need to ship something explainable, L1 with cross-validated λ is faster and more principled than any manual feature selection step."

The three moves should cover:
1. **When to use it** — the deployment signal that triggers this choice
2. **The most common trap** — what kills people in production who think they know this
3. **The diagnostic** — how to know it's working / how to debug it when it isn't

---

## The `interactivePrompt` Field

A single question rendered as an amber-bordered callout above the InteractivePanel. It forces the learner to form a prediction before touching the controls — then the interactive either confirms or contradicts it.

Format:
```
`Before you touch the controls: if you double the learning rate, do you expect the model to converge faster, slower, or fail to converge? Form your answer, then test it.`
```

Rules:
- One sentence (two max)
- Must be answerable by running the interactive
- Should create genuine uncertainty (not a gimme)
- Uses "Before you touch the controls" as the opening phrase

Examples by topic:
- Linear regression: "Before you touch the controls: if you add a feature that is pure random noise, what happens to R² on the training set vs. the test set?"
- Regularization: "Before you touch the controls: if you move λ from 0 to 1, do you expect both weights to shrink equally, or will one hit zero first?"
- Decision tree: "Before you touch the controls: if you set max_depth=1, can the tree separate the two classes in the XOR pattern? Form your prediction, then test it."
- Gradient descent: "Before you touch the controls: if the learning rate is too large, do you expect the loss to climb monotonically, oscillate, or explode — and can you predict which, given the shape of the loss surface?"

---

## The `takeaway` Field

One sentence. Crisp. The exam answer — if someone asks you what this concept is, this is the sentence you say.

Bad:
> "Gradient descent is important because it lets us train neural networks."

Good:
> "Gradient descent solves the un-searchable space problem by replacing an exhaustive search over all parameters with a local step in the direction that most reduces loss — which is all you need when the landscape is smooth enough to follow."

Or:
> "The geometry of L1 regularization (diamond) guarantees sparsity; L2 (sphere) guarantees stability — and choosing between them is choosing between feature selection and coefficient stability, not between 'strong' and 'weak' regularization."

---

## The `checkQuestions` Field — MCQ Format

```js
{
  q: `Full question stem — specific, diagnostic, not vocabulary-testing`,
  options: [
    `\`A) ...\``,
    `\`B) ...\``,
    `\`C) ...\``,
    `\`D) ...\``,
  ],
  answer: `A`,  // single capital letter
}
```

Question design rules:
- Each wrong option must be a plausible wrong intuition (not obviously absurd)
- The correct answer must include the mechanistic explanation, not just "because X"
- Cover 3-4 questions per module targeting different failure modes

---

## String Delimiter Rules (CRITICAL — avoid syntax errors)

All string fields use backtick template literals. **Never use single quotes for field values.**

```js
// CORRECT
summary: `The model's weights...`,
q: `Why does the model\`s output...`,  // escape backtick inside backtick string

// WRONG
summary: 'The model\'s weights...',    // do not use single-quote strings
```

If a field value contains a backtick character (e.g., in code, variable names like `model`s`), escape it: `\``.

Equations: use `$...$` syntax — the renderMd utility converts this to a styled equation block.
Bold: use `**text**` — renderMd converts to `<strong>`.
Code: use `` `code` `` — renderMd converts to `<code>`.

---

## Quality Gates Before Committing

After writing any module, run:
```bash
cd ~/Documents/Professional/BreakLabs/labs/ml-systems-lab && \
node --check src/data/foundations/<file>.js
```

A passing check (no output) means the JS is syntactically valid. If it fails, the error message includes the line number — fix before committing.

---

## Module Rewrite Checklist

- [ ] `summary` opens with the problem, not the definition
- [ ] One running example carried through the whole narrative
- [ ] `summary` includes a NOT-this section
- [ ] Formal definition appears after intuition
- [ ] `keyPoints` has exactly 3 items, each production-actionable
- [ ] `interactivePrompt` added, uses "Before you touch the controls" opening
- [ ] `takeaway` is one crisp sentence
- [ ] No single-quote string delimiters
- [ ] Backticks inside strings are escaped
- [ ] `node --check` passes
