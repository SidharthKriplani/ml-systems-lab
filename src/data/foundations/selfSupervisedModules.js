export const SELF_SUPERVISED_MODULES = [
  {
    id: 'ssl_overview',
    title: 'Self-supervised Learning Overview',
    subtitle: 'Label bottleneck, pretext tasks, generative vs contrastive vs predictive paradigms',
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['ssl', 'pretraining', 'representation', 'pretext tasks', 'foundation models'],
    summary: `You have 1 million images and labels for exactly 1,000 of them. Train a supervised classifier on those 1,000 labeled examples and you get 62% validation accuracy. Run self-supervised pretraining on all 1 million unlabeled images, then fine-tune on the same 1,000 labels, and you get 84%. That gap—22 percentage points from unlabeled data—is what self-supervised learning actually delivers, and understanding why it works is more useful than memorizing which method beats which benchmark.

Self-supervised learning generates its own supervision from the structure of the data itself. Instead of human-provided labels, it uses a pretext task: predict the masked word, reconstruct the missing image patch, learn representations that are invariant to different augmented views of the same image. Because the supervision signal is automatic, SSL can absorb internet-scale data that no annotation budget could touch. That is why Common Crawl—petabytes of raw web text—became the training substrate for every major language model, while ImageNet required millions of annotation hours for 1.2M images.

[FIGURE: paradigms]

The three paradigms work differently. Predictive SSL (BERT, MAE) masks content and forces the model to reconstruct it—the reconstruction pressure encodes syntax, semantics, and spatial structure because local shortcuts cannot solve the task at high mask rates. Contrastive SSL (SimCLR, MoCo) avoids reconstruction entirely, instead pulling together representations of two augmented views of the same image while pushing representations of different images apart—the model learns which variations are irrelevant (color, crop, blur) and which distinctions matter. Generative methods (autoencoders, diffusion models) reconstruct the full input from a compressed representation, learning rich structure but often at the cost of representations that are less discriminative for downstream classification.

**NOT this.** Self-supervised is not the same as unsupervised learning. Unsupervised methods like k-means or PCA find clusters and components in data without any objective tied to downstream use. SSL uses a pretext task—a constructed supervised objective derived from data structure—specifically to produce representations that transfer well. The difference is not philosophical: a representation learned by predicting masked words encodes semantic relationships because the prediction task requires them; a representation learned by PCA encodes variance, not meaning. The SSL pretext task is the mechanism that aligns what gets learned with what downstream tasks need.

The practical consequence is the pretrain-then-adapt paradigm that now dominates every modality. SSL on massive unlabeled data, followed by lightweight fine-tuning or prompting on a small labeled set, outperforms supervised training from scratch whenever unlabeled data is abundant and labels are scarce. This is not a trend. It is the current structure of the field.`,
    keyPoints: [
      `**Self-supervised learning closes a 22-point accuracy gap that supervised training on scarce labels cannot close—because pretext tasks extract signal from unlabeled data that labels never touched.**\n\nOn a 1M-image dataset with 1K labels, supervised training gets 62%; SSL pretraining on all 1M then fine-tuning on 1K gets 84%. The gap comes from unlabeled data, and the mechanism is the pretext task: it forces the model to encode structure that transfers to downstream tasks.`,
      `**A pretext task is only useful if solving it requires semantic understanding that low-level shortcuts cannot provide.**\n\nPredicting a masked word forces syntactic parsing and world knowledge. Predicting image rotation at 75% mask rate forces global object understanding. Predicting image noise level requires only texture statistics. The pretext task determines what gets learned—choosing a task that can be solved with shortcuts produces shallow representations regardless of scale.`,
      `**The three paradigms—predictive, contrastive, generative—solve different versions of the same problem: how to extract semantically rich signal from unlabeled data without annotation.**\n\nPredictive SSL masks and reconstructs; contrastive SSL aligns augmented views; generative SSL compresses and reconstructs. Each encodes different invariances. The right choice depends on what the downstream task needs: contrastive for classification and retrieval, predictive (MAE) for dense spatial tasks, generative when the representation itself must be rich enough for synthesis.`,
    ],
    interactivePrompt: `Before you touch the controls: what is the difference between a pretext task and an unsupervised objective, and why does that difference determine what representations get learned?`,
    checkQuestions: [
      {
        q: `Explain why a model trained with supervised ImageNet labels (1000-class classification) transfers less well than a CLIP model trained on 400M image-text pairs, even though both see similar amounts of compute.`,
        options: [
          `A) CLIP transfers better mainly because its dual-encoder design has roughly triple the trainable parameters of a standard ImageNet ResNet-50 classifier`,
          `B) ImageNet collapses diversity into 1000 logits; CLIP aligns 400M captions, forcing encoding of attributes ImageNet ignores`,
          `C) CLIP transfers better because contrastive loss is mathematically guaranteed to be superior to cross-entropy loss for every visual recognition task`,
          `D) ImageNet supervision causes the model to memorize individual training images pixel-for-pixel rather than learning any generalizable visual feature`,
        ],
        answer: `B`,
      },
      {
        q: `Select the two statements that correctly describe what makes a pretext task "good."`,
        options: [
          `A) A good pretext task requires semantic understanding that low-level shortcuts cannot solve, not just surface pattern matching`,
          `B) A good pretext task automatically constructs its supervision signal from the structure of the raw data itself, without labels`,
          `C) A good pretext task is any task that uses labeled data, regardless of whether shortcuts can solve it or not`,
          `D) A good pretext task is one where the model can reach zero loss as fast as possible, regardless of shortcuts used`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `A team trains an SSL model and claims it outperforms the supervised baseline on linear probe accuracy. The manager asks: does that mean SSL is better for the downstream task? What caveats would you raise?`,
        options: [
          `A) Yes — linear probe accuracy is the definitive measure of representation quality; higher linear probe means better downstream performance in all scenarios`,
          `B) Linear probe tests only linear separability, not fine-tuning; a result on one task may not predict a different downstream task`,
          `C) The only caveat is model size — if both models have the same parameter count, higher linear probe always predicts better downstream performance`,
          `D) SSL models always outperform supervised baselines when given enough data; the linear probe result is expected and requires no caveats`,
        ],
        answer: `B`,
      },
      {
        q: `Why does SSL work better on language than on images, and why did it take longer for SSL to dominate vision?`,
        options: [
          `A) Language models are inherently easier to train because publicly available text corpora are much larger than any labeled or unlabeled image dataset`,
          `B) Language has discrete tokens with natural masking boundaries; vision's continuous pixels let models solve low masking by local interpolation`,
          `C) Image SSL failed for years because convolutional networks are architecturally incapable of supporting any form of self-supervised pretraining objective`,
          `D) Vision SSL took longer to develop mainly because image labeling is cheaper than text labeling, which reduced the incentive to build SSL alternatives`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `SSL's advantage over supervised training on scarce labels comes from forcing models to solve pretext tasks that require semantic understanding—not from labels, but from the structure of unlabeled data itself. The 22-point accuracy gap on 1K labeled examples is not magic; it is what happens when a model encodes the full unlabeled distribution before seeing any label.`,
    recap: [
      `**SSL = supervision from data structure, not labels:** 1M images, 1K labels → supervised 62% vs SSL-pretrain+fine-tune 84%.`,
      `**Pretext task is the mechanism:** it must require semantics that low-level shortcuts can't provide.`,
      `**Three paradigms:** predictive (mask+reconstruct) · contrastive (align augmented views) · generative (compress+reconstruct).`,
      `**Good pretext ≠ solvable by shortcut:** masked LM good; predicting file size / noise level bad.`,
      `**SSL ≠ unsupervised:** k-means/PCA encode variance; pretext tasks encode meaning that transfers.`,
      `**Pretrain-then-adapt now dominates every modality** — the current structure of the field, not a trend.`,
    ],
    figures: {
      paradigms: `<svg viewBox="0 0 360 118" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">Three ways to build supervision from unlabeled data</text>
  <rect x="4" y="20" width="112" height="86" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="60" y="34" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Predictive</text>
  <text x="60" y="47" text-anchor="middle" fill="var(--ink-mid)" font-size="7">mask &amp; reconstruct</text>
  <text x="60" y="62" text-anchor="middle" fill="var(--ink-low)" font-size="7">BERT · MAE</text>
  <text x="60" y="80" text-anchor="middle" fill="var(--ink-mid)" font-size="7">forces syntax,</text>
  <text x="60" y="90" text-anchor="middle" fill="var(--ink-mid)" font-size="7">spatial structure</text>
  <rect x="124" y="20" width="112" height="86" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="180" y="34" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Contrastive</text>
  <text x="180" y="47" text-anchor="middle" fill="var(--ink-mid)" font-size="7">align augmented views</text>
  <text x="180" y="62" text-anchor="middle" fill="var(--ink-low)" font-size="7">SimCLR · MoCo</text>
  <text x="180" y="80" text-anchor="middle" fill="var(--ink-mid)" font-size="7">learns which</text>
  <text x="180" y="90" text-anchor="middle" fill="var(--ink-mid)" font-size="7">variations are irrelevant</text>
  <rect x="244" y="20" width="112" height="86" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="300" y="34" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Generative</text>
  <text x="300" y="47" text-anchor="middle" fill="var(--ink-mid)" font-size="7">compress &amp; reconstruct</text>
  <text x="300" y="62" text-anchor="middle" fill="var(--ink-low)" font-size="7">autoencoder · diffusion</text>
  <text x="300" y="80" text-anchor="middle" fill="var(--ink-mid)" font-size="7">rich but less</text>
  <text x="300" y="90" text-anchor="middle" fill="var(--ink-mid)" font-size="7">discriminative</text>
</svg>`,
    },
  },
  {
    id: 'contrastive_loss',
    interactiveId: 'contrastive_viz',
    title: 'Contrastive Loss Functions',
    subtitle: 'NT-Xent, InfoNCE, temperature τ, negative mining, uniformity and alignment',
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['contrastive loss', 'NT-Xent', 'InfoNCE', 'temperature', 'hard negatives', 'uniformity'],
    summary: `In a batch of 512 images, each image has one positive pair—a second augmented view of itself—and 1,022 negatives: every other image in the batch. The NT-Xent loss for positive pair (i,j) is: -log[exp(sim(zᵢ,zⱼ)/τ) / Σ_{k≠i} exp(sim(zᵢ,zₖ)/τ)]. That formula looks mechanical until you understand what each piece does. The cosine similarities in the denominator are all the "wrong" answers the model must learn to reject. The temperature τ controls how much the model focuses on the hardest wrong answers versus treating all negatives equally.

[FIGURE: pullpush]

Temperature is the hyperparameter practitioners misset most. Set τ = 0.07 (SimCLR's default) and the model concentrates gradient on the negatives closest to the anchor—useful, informative signal. Set τ = 0.01 and exp(sim/0.01) overflows: exp(1/0.01) ≈ 2.7×10^43, the softmax denominator saturates, gradients explode, training collapses to NaN within 100 steps. Set τ = 1.0 and every negative gets nearly equal weight, slowing convergence to a crawl because the signal cannot distinguish hard from easy negatives. The useful operating range is 0.07–0.2, and knowing why that range exists is more useful than memorizing it.

More negatives is not just empirically better—it is formally justified. NT-Xent is an instantiation of InfoNCE, a lower bound on mutual information I(X;C). The bound tightens as the number of negatives increases. At 512 images per batch, each anchor has 1,022 negatives; at MoCo's queue of 65,536, each anchor has 65,536 negatives. The mutual information lower bound is tighter, the discrimination task is harder, and the encoder must learn finer-grained features to identify the correct positive. This is the formal reason large batches help SimCLR and the formal reason MoCo's queue was designed to decouple negative count from batch size.

Hard negatives—items close to the anchor in embedding space but not actually the same image—carry far more gradient than easy negatives already pushed far apart. A model that has learned basic discrimination finds easy negatives uninteresting: they contribute near-zero gradient. Hard negatives force the model to learn fine-grained distinctions. But hard negatives increase false negative risk: two cat images in the same batch are treated as negatives even though they should cluster together. Debiased contrastive loss estimates and subtracts this same-class contribution from the denominator.

**NOT this.** The intuition "just lower τ to make training harder" is wrong and dangerous. τ < 0.05 causes numerical overflow before any useful learning occurs. The useful range of harder training is 0.07–0.12, not 0.01. Stabilization techniques (log-sum-exp, gradient clipping, warmup) can extend this slightly, but the fundamental constraint is the exponential—smaller τ raises every similarity to a power that overflows floating point.`,
    keyPoints: [
      `**NT-Xent is a classification problem over one positive and N−1 negatives, and the InfoNCE bound tightens as N grows—this is why more negatives is formally justified, not just empirically observed.**\n\nFor each positive pair (i,j), the loss is -log[exp(sim(zᵢ,zⱼ)/τ) / Σ_{k≠i} exp(sim(zᵢ,zₖ)/τ)]. At N=512, the bound is loose and discrimination is relatively easy. At N=65,536 (MoCo's queue), the model must learn genuinely fine-grained features to identify the correct positive among 65,536 wrong answers.`,
      `**Temperature τ controls gradient concentration: too low causes numerical overflow, too high produces indiscriminate signal—the useful range is 0.07–0.2.**\n\nAt τ=0.07, gradients concentrate on hard negatives closest to the anchor. At τ=0.01, exp(sim/0.01) overflows (exp(100) ≈ 2.7×10^43), producing NaN loss within 100 steps. At τ=1.0, all negatives contribute nearly equal gradient and the model cannot distinguish hard from easy. When contrastive training is unstable, check τ first.`,
      `**Hard negatives accelerate convergence but increase false negative risk—the two problems trade off directly, and debiased contrastive loss is the tool for managing the tradeoff.**\n\nHard negatives (items close to the anchor but not the same image) carry large gradient and force fine-grained discrimination. But two cat images in the same batch get treated as negatives, generating gradient that pushes similar semantics apart. Debiased loss estimates the same-class fraction and corrects the denominator, recovering unbiased gradient signal.`,
    ],
    interactivePrompt: `Before you touch the controls: in NT-Xent with a batch of 512, each anchor has 1,022 negatives—what happens to gradient signal as you lower temperature τ from 0.2 toward 0.01?`,
    checkQuestions: [
      {
        q: `SimCLR with a batch size of 256 gives poor results. Increasing to 4096 dramatically improves performance. Explain the mechanism.`,
        options: [
          `A) Larger batches improve gradient stability purely through better Monte Carlo estimates of the mean gradient direction, which drives SimCLR's improvement`,
          `B) At N=256, each anchor has 510 negatives — the InfoNCE bound is loose; at N=4096 it has 8190, the bound tightens, forcing finer features; MoCo decouples negatives from batch size via a queue`,
          `C) Larger batches simply increase the probability that true positive pairs appear together in the same batch, which is the core requirement NT-Xent depends on`,
          `D) Batch size affects only wall-clock training speed, not representation quality — the accuracy improvement at 4096 must come from longer effective training time`,
        ],
        answer: `B`,
      },
      {
        q: `You set temperature τ = 0.01 (very low) and training collapses to NaN loss after 100 steps. What happened?`,
        options: [
          `A) Very low temperature causes the model to ignore all negatives entirely, making the loss degenerate to exactly zero without any learning occurring`,
          `B) At τ=0.01, exp(sim/τ) overflows (exp(100)≈2.7×10⁴³), causing NaN in softmax; fix with τ≥0.05 and gradient clipping`,
          `C) τ=0.01 is simply too small a number to distinguish between positive and negative pairs, causing the model to assign uniform similarity to every pair`,
          `D) Very low temperature causes the L2 normalization step applied to embeddings to fail numerically, and that normalization failure is the true source of the NaN`,
        ],
        answer: `B`,
      },
      {
        q: `Explain why debiased contrastive loss is needed and sketch how it corrects for false negatives.`,
        options: [
          `A) Debiased contrastive loss is needed because standard NT-Xent mistakenly treats the anchor sample itself as one of its own negatives, which must be corrected`,
          `B) Standard NT-Xent treats same-class examples as false negatives; debiased loss estimates and subtracts that fraction from the denominator`,
          `C) Debiased contrastive loss addresses the false-negative problem by discarding every example that comes from the same data domain as the current anchor`,
          `D) False negatives in contrastive learning are only ever a problem at small batch sizes; debiased loss becomes unnecessary once batch size exceeds roughly 4096`,
        ],
        answer: `B`,
      },
      {
        q: `Select the two true statements about the relationship between uniformity and alignment in NT-Xent.`,
        options: [
          `A) Maximizing uniformity alone pushes all embeddings apart on the hypersphere, without regard to which pairs are positives`,
          `B) Maximizing alignment alone pulls all points together and can collapse the whole embedding space to a single point`,
          `C) Uniformity and alignment are two hyperparameters that get set once and never change during the course of training`,
          `D) NT-Xent optimizes only alignment; uniformity is claimed to emerge automatically once alignment converges to zero`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `Temperature τ is the most consequential contrastive hyperparameter: it controls whether gradients concentrate on the hardest negatives (low τ, overflow risk below 0.05) or spread uniformly over all negatives (high τ, slow convergence). More negatives tightens the InfoNCE mutual information lower bound—so methods like MoCo's 65,536-entry queue exist not as engineering convenience but as a formal improvement in what is being optimized.`,
    recap: [
      `**NT-Xent = classify 1 positive among N−1 negatives:** -log[exp(sim(zᵢ,zⱼ)/τ) / Σ_{k≠i} exp(sim(zᵢ,zₖ)/τ)].`,
      `**More negatives = tighter InfoNCE bound:** batch 512 → 1,022 negs; MoCo queue → 65,536 negs, formally harder.`,
      `**Temperature τ range 0.07–0.2:** τ=0.01 overflows (exp(100)≈2.7×10⁴³) → NaN in ~100 steps; τ=1.0 → indiscriminate, slow.`,
      `**Check τ first when contrastive training is unstable.**`,
      `**Hard negatives speed convergence but raise false-negative risk:** two cats in a batch pushed apart.`,
      `**Debiased loss** estimates the same-class fraction and corrects the denominator.`,
    ],
    figures: {
      pullpush: `<svg viewBox="0 0 360 132" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">NT-Xent: pull the one positive close, push all N−1 negatives away</text>
  <circle cx="180" cy="70" r="9" fill="var(--prime)" stroke="var(--ink-hi)"/>
  <text x="180" y="73" text-anchor="middle" fill="var(--bg)" font-size="7.5" font-weight="700">a</text>
  <text x="180" y="93" text-anchor="middle" fill="var(--ink-mid)" font-size="7">anchor z_i</text>
  <circle cx="230" cy="46" r="8" fill="#4eb87c" stroke="var(--ink-hi)"/>
  <text x="230" y="49" text-anchor="middle" fill="var(--bg)" font-size="7" font-weight="700">+</text>
  <path d="M197,63 L219,51" stroke="#4eb87c" stroke-width="2" marker-end="url(#pull)"/>
  <text x="245" y="42" fill="#4eb87c" font-size="7">positive (other view) — PULL</text>
  <circle cx="70" cy="34" r="7" fill="var(--depth)" stroke="#e85d4a"/>
  <circle cx="52" cy="70" r="7" fill="var(--depth)" stroke="#e85d4a"/>
  <circle cx="76" cy="104" r="7" fill="var(--depth)" stroke="#e85d4a"/>
  <circle cx="120" cy="112" r="7" fill="var(--depth)" stroke="#e85d4a"/>
  <path d="M164,64 L83,40" stroke="#e85d4a" stroke-width="1.3" marker-end="url(#push)"/>
  <path d="M162,71 L63,70" stroke="#e85d4a" stroke-width="1.3" marker-end="url(#push)"/>
  <path d="M166,78 L86,99" stroke="#e85d4a" stroke-width="1.3" marker-end="url(#push)"/>
  <path d="M171,80 L127,105" stroke="#e85d4a" stroke-width="1.3" marker-end="url(#push)"/>
  <text x="24" y="124" fill="#e85d4a" font-size="7">N−1 negatives — PUSH (τ concentrates on the closest)</text>
  <text x="250" y="112" fill="var(--ink-low)" font-size="6.8">low τ → focus hard negs</text>
  <text x="250" y="123" fill="var(--ink-low)" font-size="6.8">τ&lt;0.05 → overflow / NaN</text>
  <defs>
    <marker id="pull" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#4eb87c"/></marker>
    <marker id="push" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#e85d4a"/></marker>
  </defs>
</svg>`,
    },
  },
  {
    id: 'simclr',
    interactiveId: 'contrastive_viz',
    title: 'SimCLR',
    subtitle: 'Data augmentation, projection head, large-batch contrastive learning, SimCLRv2',
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['SimCLR', 'contrastive learning', 'data augmentation', 'projection head', 'batch size'],
    summary: `A batch of 256 images becomes 512 views. Each image passes through ResNet-50, producing a 2048-dimensional representation h. A 2-layer MLP maps h to a 128-dimensional z. NT-Xent loss runs on z. At fine-tuning time, the MLP is thrown away and a linear layer attaches to h. That discard is the central puzzle of SimCLR: something you train and then immediately delete turns out to be critical.

[FIGURE: pipeline]

The key to SimCLR's performance is not the architecture and not the loss—it is the augmentation composition. Random crop plus color jitter plus Gaussian blur forces the encoder to produce representations invariant to photometric and spatial perturbations. Ablate random cropping and accuracy drops sharply. Ablate color jitter and it drops further. Two random crops of the same 224×224 image can overlap by as little as 10% of the original area; the encoder must recognize the same object despite seeing drastically different local regions, which means texture matching fails and semantic encoding becomes necessary.

The projection head protects the encoder from a destructive force. Contrastive loss pressures representations to be invariant to augmentations. Color invariance is useful for the pretext task but harmful downstream—it destroys medical imaging features, defeats texture-based recognition, and removes color cues. The head takes this damage so the encoder does not have to. The encoder retains more information precisely because the loss does not reach it directly. This is not a subtle effect: removing the head and applying NT-Xent directly to h drops linear probe accuracy by roughly 10 percentage points.

SimCLR's practical bottleneck is the large-batch dependency. Good performance requires 4,096–8,192 batch size, which demands 32+ TPU cores for 100 epochs. This is not a fundamental constraint of contrastive SSL—it is an artifact of using in-batch negatives. MoCo solves this structurally with a momentum encoder and queue, decoupling negative count from batch size entirely.

**NOT this.** "You need a huge batch size for contrastive learning" is wrong—MoCo achieves the same representation quality at batch size 256 on a single 8-GPU machine. SimCLR's large-batch requirement is specific to the in-batch negative design, not to contrastive learning as a paradigm. Understanding why MoCo's queue solves the problem that SimCLR's batch size created is the conceptual test.`,
    keyPoints: [
      `**SimCLR's augmentation pipeline is the performance driver: random crop plus color jitter plus Gaussian blur encodes a prior about which invariances representations should have, and ablating any one transformation drops accuracy sharply.**\n\nTwo random crops of the same 224×224 image can overlap by as little as 10% of the original area. The encoder must recognize object identity across drastically different local regions—local texture matching fails, semantic encoding becomes necessary. The augmentation strategy is not a hyperparameter; it is a design decision about what information the representation should preserve.`,
      `**The projection head is always discarded at fine-tuning because it absorbs the destructive invariances that contrastive loss imposes—color, crop, blur—protecting the encoder from losing information useful downstream.**\n\nNT-Xent pressures representations to be augmentation-invariant. Color invariance helps the pretext task but destroys features that matter downstream. The head takes this damage; the encoder does not. Remove the head and apply loss directly to the encoder output: linear probe accuracy drops ~10 points because the encoder is now forced to discard the same information.`,
      `**SimCLR's TPU-scale requirement is an artifact of in-batch negatives, not a fundamental property of contrastive SSL—MoCo's queue decouples negative count from batch size and achieves comparable performance at batch size 256.**\n\nAt N=256, each anchor has 510 negatives; the InfoNCE bound is loose. At N=4096 each anchor has 8190 negatives; the bound tightens and the encoder learns finer distinctions. MoCo achieves 65,536 negatives without a large batch by maintaining a queue of keys from a slowly-updating momentum encoder. Same information-theoretic benefit, fraction of the compute cost.`,
    ],
    interactivePrompt: `Before you touch the controls: the projection head is discarded at fine-tuning time—if it's always thrown away, why does removing it during pretraining hurt performance?`,
    checkQuestions: [
      {
        q: `Select the two true statements about what happens if you remove SimCLR's projection head and apply NT-Xent directly to the encoder's output.`,
        options: [
          `A) Linear probe accuracy drops because the contrastive loss now pressures the encoder itself to become augmentation-invariant`,
          `B) The encoder discards color, crop, and texture information it would otherwise have preserved for downstream tasks`,
          `C) Training becomes numerically unstable because the encoder cannot produce L2-normalized output vectors without a head`,
          `D) Performance on downstream classification improves because gradients now reach the encoder more directly during training`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `A team replicates SimCLR on a proprietary medical image dataset and finds it does not benefit from the color jitter augmentation that is critical for ImageNet. Explain why and what they should do instead.`,
        options: [
          `A) Color jitter is always universally beneficial regardless of domain — the team must simply have implemented the augmentation pipeline incorrectly`,
          `B) Medical color (staining, Hounsfield units) is diagnostically meaningful, not spurious; use elastic deformation instead`,
          `C) Color jitter strength should actually be increased for medical imaging because medical images have far lower inherent color diversity than natural photos`,
          `D) Medical imaging SSL requires supervised pretraining first in every case; SimCLR's augmentations are designed for natural images and simply cannot transfer`,
        ],
        answer: `B`,
      },
      {
        q: `Explain the information bottleneck interpretation of the projection head. What information does each layer encode?`,
        options: [
          `A) The encoder encodes augmentation-invariant features while the projection head separately adds back augmentation-sensitive detail purely for the contrastive loss`,
          `B) The encoder (2048-dim) retains rich spatial and color detail; the head (128-dim) compresses to augmentation-invariant form, discarding color and exact position`,
          `C) Both the encoder and the projection head encode exactly identical information — the dimensionality reduction exists purely for computational efficiency reasons`,
          `D) The projection head encodes class-discriminative features while the encoder retains only low-level pixel features that are discarded once training finishes`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `SimCLR's projection head is discarded at fine-tuning not out of habit but because the contrastive loss forces it to absorb destructive invariances—color, crop, blur—that would harm downstream tasks if they reached the encoder. The augmentation strategy is the actual performance driver: random crop forces semantic encoding by making local texture matching geometrically impossible, and this principle—not the architecture—is what transfers to new domains.`,
    recap: [
      `**Augmentation is the performance driver:** random crop + color jitter + Gaussian blur; ablate any one and accuracy drops sharply.`,
      `**Random crop forces semantics:** two crops can overlap ~10% → texture matching fails, object identity must be encoded.`,
      `**Projection head is discarded at fine-tuning** — it absorbs destructive invariances (color/crop/blur); apply NT-Xent directly to the encoder and linear probe drops ~10 points.`,
      `**Encoder (2048-dim) stays rich; head (128-dim) compresses to augmentation-invariant.**`,
      `**Large-batch need (4,096–8,192) is an in-batch-negatives artifact, not fundamental** — MoCo hits the same quality at batch 256 on 8 GPUs.`,
      `**Domain matters:** in medical imaging color is diagnostic, so color jitter hurts — pick invariances the domain allows.`,
    ],
    figures: {
      pipeline: `<svg viewBox="0 0 360 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">One image → two augmented views → shared encoder → NT-Xent on z</text>
  <rect x="4" y="60" width="40" height="30" rx="5" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="24" y="79" text-anchor="middle" fill="var(--ink-hi)" font-size="8">img</text>
  <path d="M44,68 L64,40" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#s)"/>
  <path d="M44,82 L64,110" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#s)"/>
  <text x="52" y="46" fill="var(--ink-low)" font-size="6.5">aug t</text>
  <text x="52" y="118" fill="var(--ink-low)" font-size="6.5">aug t'</text>
  <rect x="66" y="24" width="52" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="92" y="41" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5">view 1</text>
  <rect x="66" y="100" width="52" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="92" y="117" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5">view 2</text>
  <rect x="132" y="24" width="60" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="162" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">encoder f</text>
  <text x="162" y="47" text-anchor="middle" fill="var(--ink-mid)" font-size="6.5">h (2048-d)</text>
  <rect x="132" y="100" width="60" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="162" y="114" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">encoder f</text>
  <text x="162" y="123" text-anchor="middle" fill="var(--ink-mid)" font-size="6.5">h (2048-d)</text>
  <path d="M118,37 L131,37" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#s)"/>
  <path d="M118,113 L131,113" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#s)"/>
  <rect x="206" y="24" width="58" height="26" rx="5" fill="var(--depth)" stroke="#e85d4a" stroke-dasharray="3 2"/>
  <text x="235" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="7">proj head g</text>
  <text x="235" y="47" text-anchor="middle" fill="var(--ink-mid)" font-size="6.5">z (128-d)</text>
  <rect x="206" y="100" width="58" height="26" rx="5" fill="var(--depth)" stroke="#e85d4a" stroke-dasharray="3 2"/>
  <text x="235" y="114" text-anchor="middle" fill="var(--ink-hi)" font-size="7">proj head g</text>
  <text x="235" y="123" text-anchor="middle" fill="var(--ink-mid)" font-size="6.5">z (128-d)</text>
  <path d="M192,37 L205,37" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#s)"/>
  <path d="M192,113 L205,113" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#s)"/>
  <path d="M264,37 L300,70" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#s)"/>
  <path d="M264,113 L300,80" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#s)"/>
  <rect x="300" y="60" width="56" height="30" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="328" y="79" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">NT-Xent</text>
  <text x="206" y="140" fill="#e85d4a" font-size="7">proj head discarded at fine-tune — a linear layer attaches to h</text>
  <defs><marker id="s" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
  },
  {
    id: 'moco',
    title: 'MoCo: Momentum Contrast',
    subtitle: 'Momentum encoder, queue of negatives, MoCo v2/v3, ViT adaptation',
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['MoCo', 'momentum encoder', 'queue', 'contrastive learning', 'ViT', 'BYOL'],
    summary: `SimCLR's TPU requirement is not a property of contrastive SSL—it is an artifact of where SimCLR stores its negatives. In-batch negatives give you as many negatives as your batch minus one. Get 65,536 negatives at batch size 256, and you need a different storage mechanism. The memory bank approach stores all N training embeddings and gives unlimited negatives—but as the encoder updates, embeddings produced three steps ago no longer reflect the current encoder state. The similarity comparisons in NT-Xent become incoherent because negatives come from different encoder versions. Training degrades.

[FIGURE: momentum]

MoCo's solution is a queue of 65,536 negative key embeddings combined with a momentum encoder that produces them. The momentum encoder is an exponential moving average of the query encoder: θ_k ← 0.999·θ_k + 0.001·θ_q. It never receives gradients from backpropagation. At each step, the online encoder processes the query and the momentum encoder processes the key; the key is enqueued and the oldest key is dequeued. Because the momentum encoder moves by at most 0.001 per step, all 65,536 keys in the queue reflect nearly the same encoder state—the consistency guarantee that the memory bank lost.

Why m=0.999 specifically? At m=0.5, the target encoder has a half-life of roughly one step. Keys from 256 steps ago reflect an encoder that has changed substantially—the queue is effectively a collection of inconsistent representations. MoCo's ablations show that m < 0.99 loses roughly 5 percentage points of linear probe accuracy because the queue consistency guarantee breaks down. The effective averaging window at m=0.999 spans roughly 1,000 steps, keeping all queue entries within a narrow window of encoder states.

MoCo v2 demonstrated something important: SimCLR's large-batch advantage was never about the loss or the architecture. Adding SimCLR's MLP projection head and Gaussian blur augmentation to MoCo matched SimCLR's performance at batch size 256 on 8 GPUs. The TPU requirement was an artifact of in-batch negatives, full stop.

**NOT this.** "Momentum encoder means training two separate networks" is wrong. The momentum encoder's weights are never updated by backpropagation. It is an EMA copy of the query encoder, computed deterministically at each step. It does not receive gradients. It does not have its own optimizer state. The only thing that makes it exist is the EMA update rule—remove that and you have SimCLR with a memory bank, not MoCo.`,
    keyPoints: [
      `**MoCo's momentum encoder (m=0.999) provides consistent negative keys by updating as an EMA of the query encoder—the consistency guarantee the memory bank lost as the encoder trained.**\n\nθ_k ← 0.999·θ_k + 0.001·θ_q. The key encoder never receives gradients. At m=0.999, the effective averaging window spans ~1,000 steps, so all 65,536 queue entries reflect a nearly identical encoder state. At m=0.5, queue entries from 256 steps ago reflect a substantially different encoder—the loss comparisons become incoherent and linear probe accuracy drops ~5 points.`,
      `**The FIFO queue bounds maximum staleness: removing the oldest keys first ensures no negative was produced by an encoder more than K/N_batch steps behind.**\n\nAt K=65,536 and batch size 256, maximum staleness is 256 steps. Random replacement could retain arbitrarily old keys indefinitely. The ordering is not bookkeeping—it is the operational guarantee that makes the consistency argument hold.`,
      `**The momentum EMA pattern generalized: BYOL, DINO, and data2vec all use a slowly-updating target encoder for the same reason MoCo did—whenever you need a stable target representation that lags behind the prediction network, EMA is the tool.**\n\nMoCo proved the mechanism is both necessary and sufficient to replace large batches. Every subsequent method that needed a stable target adopted the same pattern, making MoCo's core contribution a reusable primitive across the entire SSL literature.`,
    ],
    interactivePrompt: `Before you touch the controls: why would setting momentum m=0.5 instead of m=0.999 degrade MoCo's performance—what property of the queue does the momentum value protect?`,
    checkQuestions: [
      {
        q: `Select the two true statements about why m=0.5 instead of m=0.999 hurts MoCo's momentum encoder.`,
        options: [
          `A) At m=0.5, the target encoder's effective half-life shrinks to roughly one single training step instead of hundreds`,
          `B) Keys enqueued a couple hundred steps apart now reflect meaningfully different encoder states, injecting inconsistency`,
          `C) Lower momentum values make the key encoder receive direct gradients from backpropagation, which it should never do`,
          `D) m=0.5 causes the queue to permanently freeze, so no new keys are ever enqueued after the very first update step`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `MoCo uses a queue (FIFO) rather than a circular buffer with random replacement. Why does ordering matter for the consistency guarantee?`,
        options: [
          `A) FIFO ordering simply ensures the newest keys are always prioritized for training, which is claimed to provide the highest quality negatives available`,
          `B) FIFO removes the oldest keys first, bounding staleness to K/N_batch steps; random replacement could retain very old, inconsistent keys indefinitely`,
          `C) The ordering scheme does not actually matter for consistency at all — queue size K alone is the only factor affecting the staleness guarantee`,
          `D) FIFO ordering exists mainly to prevent hash collisions when inserting new keys, collisions which would otherwise corrupt the negative distribution`,
        ],
        answer: `B`,
      },
      {
        q: `The MoCo v3 paper found training instability when fine-tuning ViTs with contrastive SSL, traced to the patch embedding layer. Describe the problem and the fix.`,
        options: [
          `A) The patch embedding layer simply overfits to the specific pretraining distribution; the fix is to reinitialize it with fresh random weights before fine-tuning`,
          `B) The patch embedding gets highly variable gradients through the full stack, oscillating and causing loss spikes; fix is freezing it with a fixed projection`,
          `C) ViT patch embeddings are structurally too large for contrastive SSL to handle; reducing patch size from 16×16 down to 8×8 fully resolves the instability`,
          `D) The instability comes from the contrastive loss conflicting directly with the patch embedding's position encoding; simply removing position encodings resolves it`,
        ],
        answer: `B`,
      },
      {
        q: `Can you use the MoCo queue during fine-tuning for a downstream classification task? Why or why not?`,
        options: [
          `A) Yes — the queue continues to provide hard negatives that meaningfully improve fine-tuning results on small labeled downstream datasets`,
          `B) No — the queue and momentum encoder only support the contrastive loss during pretraining; only the query backbone transfers`,
          `C) Yes, but only during the first few epochs of fine-tuning, specifically to prevent catastrophic forgetting of the pretrained representations`,
          `D) The queue can be reused during fine-tuning as a retrieval mechanism, provided the momentum encoder is kept frozen throughout the process`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `MoCo's momentum encoder (m=0.999) solves the memory bank's consistency problem: as the encoder trains, old embeddings in a memory bank no longer reflect the current encoder state, making NT-Xent comparisons incoherent. The EMA update keeps all 65,536 queue entries within a narrow window of encoder states, delivering SimCLR-quality negative count at batch size 256 on 8 GPUs. The pattern—a slowly-updating EMA target—became the standard primitive for any SSL method needing a stable reference representation.`,
    recap: [
      `**Problem:** memory bank gives unlimited negatives but stale ones — old embeddings no longer match the current encoder → incoherent NT-Xent.`,
      `**MoCo fix:** queue of 65,536 keys + momentum encoder θ_k ← 0.999·θ_k + 0.001·θ_q (no gradients).`,
      `**m=0.999 keeps all keys consistent:** ~1,000-step window; m<0.99 loses ~5 points linear probe.`,
      `**FIFO queue bounds staleness** to K/N_batch steps (65,536/256 = 256); random replacement wouldn't.`,
      `**MoCo v2 = MoCo + SimCLR's MLP head + blur → matches SimCLR at batch 256:** proves large batch was never fundamental.`,
      `**EMA target became the SSL primitive** — reused by BYOL, DINO, data2vec.`,
    ],
    figures: {
      momentum: `<svg viewBox="0 0 360 148" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">Query encoder gets gradients; key encoder is a slow EMA copy feeding a queue</text>
  <rect x="8" y="30" width="40" height="26" rx="5" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="28" y="47" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5">query</text>
  <rect x="8" y="96" width="40" height="26" rx="5" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="28" y="113" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5">key</text>
  <rect x="66" y="26" width="70" height="34" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="101" y="40" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">encoder θ_q</text>
  <text x="101" y="51" text-anchor="middle" fill="#4eb87c" font-size="6.5">← backprop</text>
  <rect x="66" y="92" width="70" height="34" rx="5" fill="var(--prime-faint)" stroke="var(--prime)" stroke-dasharray="3 2"/>
  <text x="101" y="106" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">encoder θ_k</text>
  <text x="101" y="117" text-anchor="middle" fill="var(--ink-mid)" font-size="6.5">no gradient</text>
  <path d="M48,43 L65,43" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#m)"/>
  <path d="M48,109 L65,109" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#m)"/>
  <path d="M101,92 L101,60" stroke="#e85d4a" stroke-width="1.3" marker-end="url(#me)"/>
  <text x="106" y="78" fill="#e85d4a" font-size="6.5">θ_k ← 0.999·θ_k</text>
  <text x="106" y="87" fill="#e85d4a" font-size="6.5">+ 0.001·θ_q  (EMA)</text>
  <rect x="150" y="26" width="46" height="30" rx="5" fill="var(--depth)" stroke="var(--prime)"/>
  <text x="173" y="45" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5">q</text>
  <path d="M136,43 L149,43" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#m)"/>
  <text x="4" y="140" fill="var(--ink-low)" font-size="7">m=0.999 → ~1000-step window keeps all keys consistent; m&lt;0.99 loses ~5 pts</text>
  <text x="212" y="22" fill="var(--ink-low)" font-size="7">FIFO queue (65,536 keys) — enqueue new, dequeue oldest</text>
  <rect x="212" y="96" width="20" height="26" rx="3" fill="#4eb87c" stroke="var(--ink-hi)" opacity="0.85"/>
  <rect x="234" y="96" width="20" height="26" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="256" y="96" width="20" height="26" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="278" y="96" width="20" height="26" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="300" y="96" width="20" height="26" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="322" y="96" width="20" height="26" rx="3" fill="var(--depth)" stroke="#e85d4a" stroke-dasharray="2 2"/>
  <text x="222" y="112" text-anchor="middle" fill="var(--bg)" font-size="7" font-weight="700">new</text>
  <text x="332" y="112" text-anchor="middle" fill="#e85d4a" font-size="6">old</text>
  <path d="M136,109 L211,109" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#m)"/>
  <path d="M196,41 L280,90" stroke="var(--ink-low)" stroke-width="1" stroke-dasharray="2 2" marker-end="url(#m)"/>
  <text x="240" y="60" fill="var(--ink-low)" font-size="6.5">contrast q vs queue</text>
  <defs>
    <marker id="m" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="var(--ink-low)"/></marker>
    <marker id="me" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="#e85d4a"/></marker>
  </defs>
</svg>`,
    },
  },
  {
    id: 'byol_barlow',
    title: 'Collapse-free SSL Without Negatives',
    subtitle: `BYOL, Barlow Twins, VICReg — why they don't collapse, scale limitations`,
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['BYOL', 'Barlow Twins', 'VICReg', 'collapse', 'stop-gradient', 'negative-free SSL'],
    summary: `Contrastive methods need negatives to prevent representational collapse, but negatives introduce the false negative problem—treating same-class images as push-away targets. BYOL's 2020 paper claimed to remove negatives entirely by using a stop-gradient and a momentum EMA target network, with an asymmetric predictor. The paper could not explain analytically why this did not collapse. The real answer arrived in the follow-up literature: BYOL prevents collapse because BatchNorm computes statistics across the batch, making each sample's representation a function of all other samples in the batch. This implicit cross-sample interaction acts as an implicit negative mechanism. Replace BatchNorm with LayerNorm—per-sample normalization, no cross-batch interaction—and BYOL collapses immediately.

[FIGURE: byol]

The running example makes this concrete. BYOL uses an online network updated by backprop plus a target network updated by EMA (m≈0.996). An additional predictor MLP maps online representations to target representations. The loss minimizes L2 distance between predictor(online(view1)) and stop_gradient(target(view2)). Stop-gradient on the target branch is necessary—without it both networks collapse together by setting everything to zero. But stop-gradient alone is not sufficient: the collapse resistance comes from BatchNorm, and removing it with a larger batch (65,536) actually breaks BYOL because BatchNorm statistics converge to population statistics, eliminating the noisy cross-sample interaction that provides the implicit negative mechanism.

Barlow Twins takes a more direct approach: push the cross-correlation matrix between two views' normalized feature vectors toward identity. The invariance term (diagonal → 1) makes each feature dimension correlate with itself across views. The redundancy reduction term (off-diagonal → 0) forces different feature dimensions to decorrelate with each other—this is the explicit collapse-prevention mechanism, directly enforcing dimensional diversity without any negatives, stop-gradients, or momentum.

**NOT this.** "Removing negatives means you can use smaller batches freely" is incomplete. BYOL does work at batch size 256–512, unlike SimCLR. But at very large batches—65,536—BYOL collapses because BatchNorm statistics stabilize and the implicit negative mechanism disappears. The batch size freedom is real within a range; it does not extend to arbitrarily large batches.`,
    keyPoints: [
      `**BYOL's real collapse-prevention mechanism is BatchNorm, not stop-gradient: BatchNorm computes statistics across the batch, creating implicit cross-sample interactions that prevent all embeddings from collapsing to a constant.**\n\nReplace BatchNorm with LayerNorm—per-sample normalization—and BYOL collapses immediately. Stop-gradient is necessary to prevent both networks from trivially collapsing together, but it is not the mechanism that prevents the constant-representation solution. This finding reframed how BYOL's collapse resistance was explained, though it is not the final word: a follow-up study from BYOL's own authors showed group normalization plus weight standardization also avoids collapse without any batch statistics, so cross-batch interaction helps but is not strictly required.`,
      `**Barlow Twins prevents collapse explicitly via redundancy reduction: the off-diagonal terms of the cross-correlation matrix are pushed toward zero, forcing different feature dimensions to encode distinct information.**\n\nThe invariance term (diagonal → 1) pushes each feature to correlate across views. Without the redundancy reduction term, all feature dimensions could encode the same scalar function—the diagonal constraint alone allows dimensional collapse. The off-diagonal constraint is the collapse-prevention mechanism, and it is interpretable and debuggable in a way that BYOL's BatchNorm mechanism is not.`,
      `**At production scale with ViTs, contrastive methods outperform negative-free methods because explicit negatives provide a curriculum of hard discrimination that implicit BatchNorm mechanisms cannot match at large batch sizes.**\n\nAt batch size 65,536, BatchNorm statistics converge to population statistics, eliminating BYOL's implicit cross-sample interactions. The collapse resistance weakens exactly when scale increases. For production-scale ViT pretraining, MoCo v3 or CLIP-style contrastive outperforms BYOL.`,
      `**VICReg prevents collapse with an explicit third mechanism, neither BYOL's implicit BatchNorm trick nor Barlow Twins' cross-correlation-to-identity target: a variance term directly penalizes any embedding dimension whose per-batch standard deviation drops below a threshold.** Alongside variance, VICReg adds an invariance term (MSE between the two views' embeddings, like BYOL/Barlow Twins' alignment goal) and a covariance term (off-diagonal covariance pushed toward zero, the same redundancy-reduction idea as Barlow Twins' off-diagonal constraint). Because the variance term directly penalizes collapse rather than relying on batch statistics or a specific cross-correlation target, VICReg can apply its three losses asymmetrically per branch and doesn't depend on BatchNorm at all — it collapse-proofs itself by construction rather than by side effect.`,
    ],
    interactivePrompt: `Before you touch the controls: BYOL claims to work without negatives—what prevents all embeddings from collapsing to the same constant vector, and what happens when you replace BatchNorm with LayerNorm?`,
    checkQuestions: [
      {
        q: `Remove BatchNorm from BYOL and replace it with LayerNorm throughout. What happens and why?`,
        options: [
          `A) Training runs slower but eventually converges to identical final performance — LayerNorm is functionally equivalent to BatchNorm for SSL purposes`,
          `B) Training collapses — BYOL's collapse prevention relies on BatchNorm's cross-batch statistics, which LayerNorm's per-sample norm removes`,
          `C) The model actually converges noticeably faster because LayerNorm is more numerically stable during training than BatchNorm across large batches`,
          `D) Collapse only occurs if both BatchNorm layers are removed simultaneously; replacing only the projector's BatchNorm layer fully preserves training stability`,
        ],
        answer: `B`,
      },
      {
        q: `Barlow Twins pushes the cross-correlation matrix toward identity. What would happen if you only optimise the invariance term (diagonal → 1) without the redundancy reduction term (off-diagonal → 0)?`,
        options: [
          `A) The model would achieve noticeably higher linear probe accuracy because it focuses entirely on alignment without any competing redundancy objective`,
          `B) All feature dimensions collapse to the same scalar function — invariance alone correlates dimensions across views but allows them to be identical`,
          `C) The model would produce perfectly uniform embeddings spread across the hypersphere because the invariance term alone is sufficient to maximize uniformity`,
          `D) Without redundancy reduction the model settles on exactly 1 effective dimension, yet still learns representations useful for linear classification`,
        ],
        answer: `B`,
      },
      {
        q: `A team trains BYOL on a dataset with very large batch size (65536) and finds it suddenly collapses. They had used batch size 512 successfully before. Explain the mechanism.`,
        options: [
          `A) Very large batches cause the momentum encoder to update far too quickly relative to the query network, destabilizing the target representations`,
          `B) At very large batches, BatchNorm statistics converge to stable values, removing the cross-sample noise behind BYOL's collapse resistance`,
          `C) Large batch sizes trigger gradient explosion specifically inside the predictor network, which then overwrites the already-learned representations`,
          `D) BYOL collapses at large batches simply because the count of false negatives ends up exceeding the count of true negatives in that batch`,
        ],
        answer: `B`,
      },
      {
        q: `Select the two scenarios where you would prefer Barlow Twins over BYOL for a production pretraining run.`,
        options: [
          `A) The architecture uses LayerNorm or GroupNorm instead of BatchNorm, so BYOL's implicit collapse-prevention mechanism cannot function`,
          `B) You need explicit, interpretable collapse prevention for debugging rather than an implicit BatchNorm-dependent mechanism`,
          `C) The dataset is very small and contrastive-style pretraining is assumed to be computationally infeasible at that scale`,
          `D) The downstream task requires exact feature decorrelation, which is claimed to make BYOL unconditionally worse in every case`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `BYOL does not prevent collapse via stop-gradient alone—it prevents collapse because BatchNorm creates implicit cross-sample interactions that act as implicit negatives. Replace BatchNorm with LayerNorm and BYOL collapses immediately. This mechanism also explains BYOL's large-batch failure: at batch size 65,536, BatchNorm statistics stabilize and the implicit negative mechanism disappears. Barlow Twins makes the collapse-prevention mechanism explicit and interpretable, which is why it remains the right default when the BatchNorm mechanism is unavailable.`,
    recap: [
      `**Negatives prevent collapse but cause false negatives:** same-class images treated as push-away.`,
      `**BYOL setup:** online (backprop) + target (EMA m≈0.996) + predictor MLP, minimize L2 to stop-gradient target.`,
      `**Real collapse-preventer is BatchNorm, not stop-gradient:** cross-batch stats = implicit negatives; swap to LayerNorm and BYOL collapses immediately.`,
      `**Stop-gradient necessary but not sufficient** — without it both nets collapse to zero.`,
      `**BYOL breaks at batch 65,536:** BatchNorm stats stabilize → implicit-negative mechanism vanishes.`,
      `**Barlow Twins = explicit fix:** cross-correlation → identity; diagonal→1 (invariance), off-diagonal→0 (redundancy reduction = collapse prevention).`,
      `**At ViT/production scale, contrastive (MoCo v3 / CLIP) beats negative-free.**`,
    ],
    figures: {
      byol: `<svg viewBox="0 0 360 142" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">No negatives — asymmetric: predictor + stop-gradient on the EMA target branch</text>
  <text x="10" y="30" fill="#4eb87c" font-size="7" font-weight="700">online (backprop)</text>
  <rect x="10" y="36" width="52" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="36" y="51" text-anchor="middle" fill="var(--ink-hi)" font-size="7">encoder</text>
  <rect x="72" y="36" width="52" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="98" y="51" text-anchor="middle" fill="var(--ink-hi)" font-size="7">projector</text>
  <rect x="134" y="36" width="56" height="24" rx="5" fill="var(--depth)" stroke="#4eb87c"/>
  <text x="162" y="48" text-anchor="middle" fill="var(--ink-hi)" font-size="7">predictor</text>
  <text x="162" y="57" text-anchor="middle" fill="var(--ink-mid)" font-size="6">(asymmetry)</text>
  <path d="M62,48 L71,48" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#b)"/>
  <path d="M124,48 L133,48" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#b)"/>
  <text x="10" y="88" fill="var(--ink-low)" font-size="7" font-weight="700">target (EMA m≈0.996)</text>
  <rect x="10" y="94" width="52" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)" stroke-dasharray="3 2"/>
  <text x="36" y="109" text-anchor="middle" fill="var(--ink-hi)" font-size="7">encoder</text>
  <rect x="72" y="94" width="52" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)" stroke-dasharray="3 2"/>
  <text x="98" y="109" text-anchor="middle" fill="var(--ink-hi)" font-size="7">projector</text>
  <path d="M62,106 L71,106" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#b)"/>
  <rect x="134" y="94" width="56" height="24" rx="5" fill="var(--depth)" stroke="#e85d4a"/>
  <text x="162" y="109" text-anchor="middle" fill="#e85d4a" font-size="6.5" font-weight="700">stop-grad</text>
  <path d="M124,106 L133,106" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#b)"/>
  <path d="M36,60 L36,93" stroke="#e85d4a" stroke-width="1.2" stroke-dasharray="2 2" marker-end="url(#be)"/>
  <text x="40" y="80" fill="#e85d4a" font-size="6">EMA copy</text>
  <rect x="230" y="60" width="60" height="34" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="260" y="74" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">L2 loss</text>
  <text x="260" y="86" text-anchor="middle" fill="var(--ink-mid)" font-size="6.5">pred ≈ target</text>
  <path d="M190,48 L230,72" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#b)"/>
  <path d="M190,106 L230,84" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#b)"/>
  <text x="4" y="134" fill="#e85d4a" font-size="7">Real collapse-preventer = BatchNorm's cross-batch stats; LayerNorm → collapses</text>
  <defs>
    <marker id="b" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="var(--ink-low)"/></marker>
    <marker id="be" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="#e85d4a"/></marker>
  </defs>
</svg>`,
    },
  },
  {
    id: 'masked_autoencoders',
    interactiveId: 'mask_ratio_viz',
    title: 'Masked Autoencoders and Masked Prediction',
    subtitle: 'MAE, BERT masking, high masking ratio, asymmetric encoder-decoder, data2vec',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['MAE', 'masked autoencoder', 'BERT', 'masked prediction', 'ViT', 'data2vec'],
    summary: `A 224×224 image divides into 196 patches of 16×16 pixels each. MAE masks 75% of them—147 patches—and asks the encoder to see only the remaining 49. The decoder, given the encoded visible patches plus learnable mask tokens, reconstructs the original pixel values of all 147 hidden patches. The question is: why does this work at 75% masking but fail to learn semantics at 25% masking?

[FIGURE: maskrecon]

At 25% masking, there are enough adjacent unmasked patches that a model can solve the reconstruction task by bicubic interpolation. It copies pixel values from neighboring patches, produces low reconstruction error, and learns nothing about global image structure. The training objective is satisfied without semantic encoding. This is the fundamental failure mode of naive generative SSL applied to images: spatial redundancy gives the model a shortcut that bypasses the intended learning signal.

At 75% masking, local interpolation becomes geometrically impossible. There are no adjacent unmasked patches to copy from. Reconstruction now requires understanding that this region of sky is above this horizon, that this arm extends from this torso, that this wheel is underneath this car. The encoder must encode global semantic relationships because local statistics cannot solve the task. MAE's ablations show linear probe accuracy rising monotonically from 25% to 75% masking—the shortcut disappears gradually as masking increases.

The architectural asymmetry matters for the same reason. MAE's encoder processes only 49 visible patches. A shallow decoder (8 Transformer blocks versus the encoder's 24) receives the encoded patches plus mask tokens and reconstructs pixel values. If the decoder were deep and powerful, it could absorb the reconstruction burden through internal inpainting—doing the semantic work that should force the encoder to learn. The weak decoder ensures reconstruction quality depends primarily on what the encoder encoded. Both the masking ratio and the asymmetric architecture are constraints that close the same shortcut from different directions.

**NOT this.** "MAE is just image compression" is wrong. Compression aims for compact, lossless or near-lossless representation of pixel values. MAE's goal is not compression—it is producing representations that transfer to downstream tasks. The pixel reconstruction loss is low-level, but the representations that make reconstruction possible at 75% masking are not. A high-quality compressor trained to minimize MAE's pixel loss would not produce useful classification representations; a model forced to solve MAE's reconstruction task builds semantic understanding because there is no other way to solve it.`,
    keyPoints: [
      `**75% masking is the threshold where local interpolation from adjacent patches becomes geometrically impossible, forcing the encoder to capture global semantic structure to reconstruct missing regions.**\n\nAt 25% masking, bicubic interpolation from neighboring patches solves the task—no semantic understanding required. MAE's ablations show linear probe accuracy rising monotonically as masking increases to 75%. Below that threshold, the reconstruction objective trains a texture interpolator, not a semantic encoder.`,
      `**The asymmetric encoder-decoder design closes the same shortcut from the architecture side: a deliberately weak decoder ensures reconstruction quality comes from the encoder, not from internal decoder inpainting.**\n\nMAE's encoder processes only 25% of patches (24 Transformer blocks). The decoder (8 blocks) receives encoded patches plus mask tokens and reconstructs pixel values. A strong decoder would absorb the reconstruction burden—doing semantics internally and letting the encoder be lazy. The weak decoder forces the encoder to encode global structure because the decoder cannot compensate for a low-quality representation.`,
      `**MAE representations excel at dense prediction (detection, segmentation) while contrastive representations excel at classification and retrieval—the pretraining objective determines what information is preserved.**\n\nPixel reconstruction preserves fine-grained local spatial detail that contrastive loss compresses away by optimizing for object-level invariances. MAE achieves 68% linear probe vs SimCLR's ~70%, but fine-tunes to 83.6% vs SimCLR's ~76%—the richer local information is not linearly organized but is accessible to a fine-tuned nonlinear network.`,
      `**data2vec swaps MAE's reconstruction target from raw pixels to latent teacher representations: an EMA-updated teacher encoder sees the full unmasked input and produces continuous target features, and the student predicts those latents at the masked positions.** Because the targets are already-abstracted semantic features rather than raw pixel values, data2vec's representations come out more linearly separable — favoring linear probing — while MAE's pixel-reconstruction targets keep fine-grained spatial detail that only a fine-tuned nonlinear network (or a dense prediction head) can fully exploit, favoring detection and segmentation. Same masked-prediction shell, different target space, different downstream strength.`,
    ],
    interactivePrompt: `Before you touch the controls: if MAE used 25% masking instead of 75%, what shortcut would the model exploit, and why does raising the masking ratio eliminate it?`,
    checkQuestions: [
      {
        q: `Select the two true statements about what happens when MAE's masking ratio is reduced from 75% to 25%.`,
        options: [
          `A) The decoder can reconstruct masked patches via local interpolation from nearby visible patches instead of learning semantics`,
          `B) Linear probe accuracy on the resulting learned representations degrades noticeably relative to the 75% masking setting`,
          `C) The encoder is forced to see less of the image per forward pass, which is claimed to always improve representation quality`,
          `D) Training becomes numerically unstable because the decoder receives too few mask tokens to process correctly`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why is the MAE decoder deliberately made shallow and weak, even though a stronger decoder would produce better reconstruction?`,
        options: [
          `A) A weak decoder mainly reduces total training compute, making MAE faster to train without meaningfully sacrificing final representation quality`,
          `B) A strong decoder would absorb reconstruction through internal inpainting; the weak decoder forces quality to depend on encoder-side semantic content`,
          `C) A weak decoder is used primarily to prevent the whole model from overfitting to the specific training images during the reconstruction task`,
          `D) Decoder strength genuinely does not matter here — MAE uses a fixed reconstruction target that structurally prevents the decoder from learning task-specific shortcuts`,
        ],
        answer: `B`,
      },
      {
        q: `Compare MAE and data2vec on the same ViT backbone. For which downstream task would you prefer MAE, and for which would you prefer data2vec?`,
        options: [
          `A) MAE is better across essentially all tasks because pixel-level reconstruction inherently preserves more information than any latent-space prediction target`,
          `B) MAE suits dense prediction (detection, segmentation) via fine-grained pixel detail; data2vec suits linear probing since EMA teacher latents force semantics`,
          `C) data2vec is better across all tasks because semantic reconstruction targets are, in every case, categorically superior to raw pixel-level targets`,
          `D) The choice depends entirely on dataset size — use MAE for datasets larger than 1M images and data2vec whenever the dataset is smaller`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `MAE's 75% masking ratio is not arbitrary—it is the threshold where local interpolation from adjacent patches becomes geometrically impossible, forcing the encoder to capture global semantic structure. The weak decoder closes the same shortcut from the architecture side: a strong decoder would do the semantic work internally and allow the encoder to be shallow. Together, the masking ratio and architectural asymmetry ensure reconstruction quality can only come from genuine semantic encoding.`,
    recap: [
      `**MAE setup:** 224×224 → 196 patches (16×16); mask 75% (147), encode 49 visible, decoder reconstructs hidden pixels.`,
      `**25% masking fails:** adjacent patches let the model interpolate (bicubic) — no semantics learned.`,
      `**75% masking works:** local interpolation geometrically impossible → encoder must capture global structure; linear probe rises monotonically to 75%.`,
      `**Asymmetric encoder-decoder closes the shortcut too:** weak decoder (8 blocks) vs deep encoder (24) forces the encoder to do the semantic work.`,
      `**MAE ≠ compression** — goal is transferable representations, not compact pixels.`,
      `**MAE for dense tasks (detection/segmentation); contrastive for classification/retrieval:** MAE 68% probe / 83.6% fine-tuned vs SimCLR ~70% / ~76%.`,
    ],
    figures: {
      maskrecon: `<svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">Mask 75% of patches · encode only the 25% visible · decoder rebuilds pixels</text>
  <text x="30" y="28" text-anchor="middle" fill="var(--ink-mid)" font-size="7">input (masked)</text>
  <rect x="6" y="32" width="14" height="14" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="22" y="32" width="14" height="14" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="38" y="32" width="14" height="14" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="6" y="48" width="14" height="14" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="22" y="48" width="14" height="14" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="38" y="48" width="14" height="14" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="6" y="64" width="14" height="14" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="22" y="64" width="14" height="14" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="38" y="64" width="14" height="14" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="30" y="92" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">filled=visible</text>
  <text x="30" y="101" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">empty=masked</text>
  <rect x="78" y="38" width="52" height="34" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="104" y="52" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">encoder</text>
  <text x="104" y="63" text-anchor="middle" fill="var(--ink-mid)" font-size="6.5">24 blocks · deep</text>
  <path d="M54,55 L77,55" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#mk)"/>
  <text x="60" y="50" fill="var(--ink-low)" font-size="6">49 vis</text>
  <rect x="152" y="42" width="52" height="26" rx="5" fill="var(--depth)" stroke="#e85d4a"/>
  <text x="178" y="52" text-anchor="middle" fill="var(--ink-hi)" font-size="7">decoder</text>
  <text x="178" y="62" text-anchor="middle" fill="#e85d4a" font-size="6">8 blocks · weak</text>
  <path d="M130,55 L151,55" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#mk)"/>
  <text x="134" y="50" fill="var(--ink-low)" font-size="5.5">+mask tok</text>
  <text x="320" y="28" text-anchor="middle" fill="var(--ink-mid)" font-size="7">reconstruction</text>
  <rect x="296" y="32" width="14" height="14" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="312" y="32" width="14" height="14" fill="#4eb87c" stroke="var(--ink-hi)" opacity="0.7"/>
  <rect x="328" y="32" width="14" height="14" fill="#4eb87c" stroke="var(--ink-hi)" opacity="0.7"/>
  <rect x="296" y="48" width="14" height="14" fill="#4eb87c" stroke="var(--ink-hi)" opacity="0.7"/>
  <rect x="312" y="48" width="14" height="14" fill="#4eb87c" stroke="var(--ink-hi)" opacity="0.7"/>
  <rect x="328" y="48" width="14" height="14" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="296" y="64" width="14" height="14" fill="#4eb87c" stroke="var(--ink-hi)" opacity="0.7"/>
  <rect x="312" y="64" width="14" height="14" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="328" y="64" width="14" height="14" fill="#4eb87c" stroke="var(--ink-hi)" opacity="0.7"/>
  <path d="M204,55 L295,55" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#mk)"/>
  <text x="4" y="112" fill="var(--ink-low)" font-size="7">25% masking → interpolate from neighbors (shortcut). 75% → must encode global structure.</text>
  <defs><marker id="mk" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
  },
  {
    id: 'clip_alignment',
    title: 'CLIP and Multimodal Contrastive Alignment',
    subtitle: 'Image-text contrastive pretraining, zero-shot classification, ALIGN, CLIP failure modes',
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['CLIP', 'multimodal', 'contrastive', 'zero-shot', 'ALIGN', 'image-text alignment'],
    summary: `An image search system trained on 400 million image-text pairs from the web can, at zero-shot, classify images into 1,000 ImageNet categories at 76% top-1 accuracy—without ever seeing an ImageNet label. The mechanism is not magic: the web contains images of golden retrievers paired with captions that say "golden retriever," images of airplanes paired with captions that say "airplane," and so on for essentially every visual concept. CLIP trains an image encoder and a text encoder to align their representations for matching pairs, using InfoNCE loss over all N²-N non-matching pairs in each batch.

Zero-shot classification works because encoding "a photo of a {class}" with the text encoder places it in the region of embedding space where the image encoder maps images of that class. The text template acts as a classifier without fine-tuning. The mechanism fails on concepts absent from the pretraining distribution—CLIP cannot classify medical imaging findings that never appeared in web image-text pairs, because there is no alignment relationship to transfer.

[FIGURE: alignment]

The training loss scales with N². For a batch of N pairs, compute an N×N similarity matrix where S_{ij} = cosine_sim(img_i, txt_j). Loss is mean cross-entropy over rows (image finds correct text) and columns (text finds correct image). Temperature τ is learned starting at 0.07, with a clamp at τ ≥ 0.01 to prevent overflow. At batch size 32,768 on 256 GPUs, each pair has 32,767 negatives in both directions—a tight mutual information estimate.

Why CLIP embeddings generalize broadly is the key insight. A supervised ImageNet classifier needs only features that distinguish 1,000 categories; texture and background are often sufficient. CLIP must align images with their natural language descriptions, and language describes everything: color, texture, style, spatial layout, action, emotion, domain. The image encoder must encode everything language can describe. This is why CLIP representations transfer to tasks that ImageNet classifiers systematically fail on.

**NOT this.** "CLIP understands compositional descriptions" is wrong. "A red cube on a blue sphere" and "a blue cube on a red sphere" receive similar CLIP scores. The model encodes "red," "cube," "blue," "sphere," and "on" as separately weighted features that co-occur with certain images—a bag of co-occurring features, not a compositionally bound description. The ARO benchmark shows CLIP performs near chance on relation, attribute, and ordering understanding. The failure is systematic, not incidental, because the contrastive objective does not require compositional understanding—only co-occurrence alignment.`,
    keyPoints: [
      `**CLIP zero-shot classification works because web-scale image-text pairs contain essentially every visual concept paired with its name—the aligned embedding space transfers this co-occurrence knowledge into a zero-shot classifier.**\n\nEncoding "a photo of a {class}" places the text embedding in the region where matched images cluster. Prompt engineering moves ImageNet top-1 accuracy by ~3.5 points because CLIP was trained on photo captions, not bare class names. The mechanism fails on out-of-distribution concepts: medical imaging findings not in web image-text pairs have no alignment relationship to transfer.`,
      `**CLIP embeddings generalize broadly because aligning images with open-vocabulary text descriptions forces encoding of everything language can describe—color, texture, style, spatial layout, action—whereas supervised ImageNet training only needs features sufficient to distinguish 1,000 categories.**\n\nSupervised ImageNet collapses all visual diversity into 1,000 class logits and discards the rest. CLIP must align 400M unique descriptions, forcing fine-grained attribute encoding that ImageNet training ignores. This is the mechanistic explanation for CLIP's transfer advantage, not architecture or scale alone.`,
      `**CLIP fails systematically on compositional and relational descriptions: "a red cube on a blue sphere" and "a blue cube on a red sphere" receive similar scores because CLIP encodes descriptions as bags of co-occurring features, not compositionally bound relations.**\n\nThe ARO benchmark shows CLIP at near chance on relation, attribute, and ordering understanding. This is not a corner case—any task requiring binding attributes to specific objects or understanding spatial relations will fail. The contrastive objective requires only co-occurrence alignment, not compositional grounding.`,
    ],
    interactivePrompt: `Before you touch the controls: CLIP achieves 76% ImageNet top-1 zero-shot without ever seeing an ImageNet label—what is the actual mechanism that makes this possible, and why does it fail on medical images?`,
    checkQuestions: [
      {
        q: `Why does CLIP achieve 76% top-1 on ImageNet zero-shot despite never seeing ImageNet labels? What makes this possible?`,
        options: [
          `A) CLIP simply memorizes essentially all common visual concepts during pretraining because 400M pairs is enough data to overfit to any benchmark`,
          `B) CLIP's 400M web pairs cover most ImageNet classes via co-occurrence; "a photo of a golden retriever" aligns with the matching visual region`,
          `C) CLIP achieves 76% simply because ImageNet's exact 1000 categories were explicitly curated into the 400M web-scraped training pair collection beforehand`,
          `D) Zero-shot performance here is possible mainly because ViT architectures generalize structurally better than ResNets do to categories never seen in training`,
        ],
        answer: `B`,
      },
      {
        q: `A team uses CLIP to build a visual similarity search system for a medical image archive. After deployment, they find retrieval quality is poor and the system fails to distinguish between benign and malignant radiological findings. Diagnose the problem and propose fixes.`,
        options: [
          `A) CLIP's retrieval is poor mainly because the medical archive images are JPEG-compressed; switching to lossless PNG format should improve similarity scores`,
          `B) Medical images (CT, MRI, histology) are out-of-distribution for CLIP trained on web photos; fix by fine-tuning on medical image-text pairs`,
          `C) CLIP's cosine similarity metric is fundamentally inappropriate for medical images; the fix is replacing it with plain Euclidean distance in the embedding space`,
          `D) The real problem is insufficient training of the retrieval index itself; rebuilding the FAISS index with more nprobe iterations should improve recall`,
        ],
        answer: `B`,
      },
      {
        q: `Select the two true statements about CLIP's learned temperature τ.`,
        options: [
          `A) A learned τ removes the need for per-experiment manual hyperparameter search, adapting sharpness as training progresses`,
          `B) τ can collapse toward zero during training, causing the softmax to become extremely peaked and gradients to explode`,
          `C) CLIP lets τ grow without bound above 1.0, which is what actually causes the training instability it must guard against`,
          `D) A fixed τ would make the model ignore all positive pairs entirely, so a learned τ exists mainly to fix that failure`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `CLIP's zero-shot capability works because web-scale image-text co-occurrence covers essentially all visual concepts, and aligning images with open-vocabulary descriptions forces encoding of everything language can describe. The failure mode—poor performance on compositional and relational descriptions—is systematic: CLIP encodes co-occurrence, not composition, so any task requiring binding attributes to specific objects will fail regardless of scale.`,
    recap: [
      `**CLIP = align image + text encoders on 400M web pairs** via InfoNCE over the N×N similarity matrix.`,
      `**Zero-shot 76% ImageNet top-1, no ImageNet labels:** "a photo of a {class}" lands in the matched-image region.`,
      `**Broad transfer because language describes everything:** color, style, layout, action — encoder must encode it all; supervised ImageNet collapses to 1,000 logits and discards the rest.`,
      `**Learned τ (start 0.07, clamp ≥0.01)** to prevent overflow.`,
      `**Fails on out-of-distribution concepts** (e.g. medical imaging) — no alignment relationship to transfer; fine-tune on domain image-text.`,
      `**Fails on composition/relations:** "red cube on blue sphere" ≈ "blue cube on red sphere"; near-chance on ARO — encodes co-occurrence, not binding.`,
    ],
    figures: {
      alignment: `<svg viewBox="0 0 360 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">Two encoders → N×N similarity matrix · diagonal = matched pairs (pull)</text>
  <rect x="6" y="26" width="46" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="29" y="41" text-anchor="middle" fill="var(--ink-hi)" font-size="7">img enc</text>
  <rect x="6" y="88" width="46" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="29" y="103" text-anchor="middle" fill="var(--ink-hi)" font-size="7">txt enc</text>
  <text x="90" y="24" fill="var(--ink-mid)" font-size="7">text embeddings T1..T4 →</text>
  <text x="66" y="72" fill="var(--ink-mid)" font-size="7" transform="rotate(-90 66 72)">images I1..I4 ↓</text>
  <rect x="90" y="30" width="22" height="22" fill="#4eb87c" stroke="var(--ink-hi)" opacity="0.85"/>
  <rect x="114" y="30" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="138" y="30" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="162" y="30" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="90" y="54" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="114" y="54" width="22" height="22" fill="#4eb87c" stroke="var(--ink-hi)" opacity="0.85"/>
  <rect x="138" y="54" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="162" y="54" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="90" y="78" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="114" y="78" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="138" y="78" width="22" height="22" fill="#4eb87c" stroke="var(--ink-hi)" opacity="0.85"/>
  <rect x="162" y="78" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="90" y="102" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="114" y="102" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="138" y="102" width="22" height="22" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="162" y="102" width="22" height="22" fill="#4eb87c" stroke="var(--ink-hi)" opacity="0.85"/>
  <text x="212" y="40" fill="#4eb87c" font-size="7" font-weight="700">diagonal → maximize</text>
  <text x="212" y="52" fill="var(--ink-mid)" font-size="6.5">matched image-text pairs</text>
  <text x="212" y="72" fill="#e85d4a" font-size="7" font-weight="700">off-diagonal → minimize</text>
  <text x="212" y="84" fill="var(--ink-mid)" font-size="6.5">N²−N mismatched pairs</text>
  <text x="212" y="104" fill="var(--ink-low)" font-size="6.5">InfoNCE over rows + cols,</text>
  <text x="212" y="114" fill="var(--ink-low)" font-size="6.5">learned τ (start 0.07)</text>
  <text x="212" y="130" fill="var(--ink-low)" font-size="6.5">zero-shot: "a photo of a {class}"</text>
</svg>`,
    },
  },
  {
    id: 'ssl_for_tabular',
    title: 'SSL on Non-Image and Non-Text Data',
    subtitle: 'Tabular SSL (SCARF, VIME), graph SSL, audio SSL (wav2vec, HuBERT), domain applicability',
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['tabular SSL', 'SCARF', 'VIME', 'graph SSL', 'wav2vec', 'HuBERT', 'audio SSL'],
    summary: `A fraud detection dataset: 200 features, 5% labeled, 95% unlabeled. A supervised XGBoost model on the labeled 5% achieves baseline AUC. SCARF—self-supervised contrastive learning using random feature corruption—pretrain on all data, then fine-tune on the labeled 5%, and AUC improves. The question worth understanding is: why does this particular corruption strategy work, and when does it not?

SCARF corrupts a fraction α of feature values by replacing them with draws from that feature's marginal distribution. The original row and the corrupted row form a positive pair. NT-Xent loss runs over positive and in-batch negative pairs. The key design choice is marginal-distribution corruption: a drawn value looks plausible—it falls within the natural range of that feature—so the model cannot detect corruption by checking whether values are out-of-range. Detection requires understanding how features relate to each other. If a patient's age is 35 but their feature for "years since retirement" suddenly draws a value of 12, the model must understand that these features are correlated to notice the inconsistency. The SSL pretraining forces encoding of inter-feature relationships, which is exactly what transfers to downstream fraud detection. VIME takes a complementary route to the same problem: instead of a contrastive pull-push objective, it pretrains the encoder on two reconstruction pretext tasks—estimating which features were masked and reconstructing their original corrupted values—forcing the same inter-feature dependency encoding through denoising rather than contrastive alignment.

This logic also predicts when tabular SSL fails. If features are heavily engineered—explicitly encoding the correlations that SCARF would otherwise force the model to learn—then pretraining learns redundant structure. If the labeled dataset is large enough that supervised training can already capture inter-feature relationships directly, SSL adds noise without signal. The overhead is only justified when unlabeled data is substantially larger than labeled data and features are not already explicitly relational.

Audio SSL (wav2vec 2.0, HuBERT) is the most successful SSL transfer outside text and vision precisely because speech has natural temporal structure—phonemes, words, prosody—that maps cleanly onto masked prediction without special augmentation design. Fine-tuning on just 10 minutes of labeled speech still achieves a competitive word error rate — a separate, even more extreme low-label result. The paper's headline "100× less labeled data" figure specifically compares its 100-hour labeled fine-tune to prior state of the art, not the 10-minute case.

**NOT this.** "Tabular SSL always helps when you have unlabeled data" is wrong. If features are heavily engineered and correlations are already explicit, SSL learns redundant structure it cannot leverage downstream. The unlabeled data advantage only materializes when the SSL pretext task discovers non-obvious inter-feature relationships that supervised training on the small labeled set would miss.`,
    keyPoints: [
      `**SCARF corrupts features by drawing from their marginal distributions, not from noise—because plausible-looking values force the model to detect corruption through inter-feature relationships rather than out-of-range detection.**\n\nA Gaussian noise corruption at 3σ is detectable from the feature's own distribution alone. A marginal-distribution draw falls within the natural range; detection requires noticing that this age conflicts with that retirement year, or that this income conflicts with that transaction amount. The pretext task forces encoding of exactly the inter-feature dependencies that transfer to downstream tasks.`,
      `**Tabular SSL helps when unlabeled data is abundant, labeled data is scarce, and features have non-obvious correlations—it fails when features are heavily engineered or the labeled set is large enough for direct supervised learning.**\n\nIf explicit feature engineering already captures correlations (ratio features, interaction terms), SSL cannot discover structure beyond what is already visible. The break-even point is roughly when unlabeled data is 10× the labeled set and the feature space has high-dimensional correlations that domain-expert engineering has not yet captured.`,
      `**Audio SSL (wav2vec 2.0) needs remarkably little labeled data: 10 minutes gets a competitive word error rate, and separately, its 100-hour labeled subset matches prior state of the art while using 100× less labeled data — because temporal masking maps cleanly onto the same masked prediction framework that works for text, without special augmentation design.**\n\nSpeech has natural temporal structure (phonemes, words, prosody) analogous to linguistic structure in text. A CNN encoder produces local audio representations; a Transformer contextualizes them; a quantizer discretizes them into codebook entries; contrastive loss predicts the quantized representation of masked timesteps. The discrete codebook provides stable classification targets analogous to BERT's token vocabulary — using the continuous (unquantized) representations directly as targets instead risks collapse to a constant representation, since there is no discrete assignment step to break the symmetry that pushes different timesteps toward different targets.`,
      `**Graph SSL augmentations must respect what an edge actually means in that graph — the same edge-drop augmentation (GraphCL) is valid for social networks but breaks molecular graphs.** In a social network, an edge is a partial, noisy observation of a relationship — dropping some edges is a plausible view of incomplete data, so contrastive pretraining across edge-dropped views teaches robustness to missing links. In a molecule, an edge is a bond that defines the molecule's chemical identity — dropping it doesn't create a noisy view of the same molecule, it creates a different molecule (or an invalid one). The lesson generalizes beyond graphs: any augmentation strategy has to preserve the property that makes two views "the same underlying thing," and what counts as noise in one domain can be identity-breaking in another.`,
    ],
    interactivePrompt: `Before you touch the controls: SCARF replaces corrupted feature values with draws from the marginal distribution rather than with zeros or Gaussian noise—what specific detection mechanism does this design choice force the encoder to learn?`,
    checkQuestions: [
      {
        q: `Select the two plausible causes of SCARF failing to improve AUC over the XGBoost baseline on this fraud dataset.`,
        options: [
          `A) The 200 features are already heavily engineered, so they explicitly encode the correlations SCARF's pretext task seeks`,
          `B) Fraud is temporal and sequential, but SCARF's row-level corruption ignores transaction-sequence structure entirely`,
          `C) SCARF structurally cannot process any dataset that contains binary flag features alongside continuous ones`,
          `D) This result proves conclusively that gradient-boosted trees are always superior to any SSL method on tabular data`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `wav2vec 2.0 uses both a quantizer and a contrastive loss. Why is the quantizer needed? What would happen if you used the continuous representations as targets instead?`,
        options: [
          `A) The quantizer mainly reduces memory usage by compressing audio representations; without it the model would simply run out of GPU memory`,
          `B) Without quantization, continuous targets risk collapse to constant representations; discrete codebook assignments give stable, symmetry-breaking targets`,
          `C) The quantizer is only needed to support streaming inference scenarios; it can safely be removed during training without affecting learned representations`,
          `D) Using continuous targets instead of quantized ones would actually improve performance because the model retains strictly more information in its training signal`,
        ],
        answer: `B`,
      },
      {
        q: `Compare GraphCL\`s edge-drop augmentation for molecular graphs vs social network graphs. Why does the same augmentation have different effects across domains?`,
        options: [
          `A) Edge-drop simply works better on molecular graphs because molecules on average have more edges per node than typical social network graphs do`,
          `B) In molecules, edges are bonds defining identity — dropping them changes the molecule; in social graphs edges are partial observations, so edge-drop is valid`,
          `C) Edge-drop performs identically across both domains in practice — the performance differences researchers observed are purely artifacts of dataset size, not domain semantics`,
          `D) Edge-drop harms molecular graphs mainly because molecules are smaller graphs where losing any single edge is catastrophic to overall structure`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `SSL does not transfer seamlessly across domains—the corruption or augmentation strategy must reflect what variations leave the semantic identity of a sample invariant. For tabular data, marginal-distribution corruption forces detection through inter-feature relationships, which is exactly what transfers downstream. For audio, temporal masking maps onto the same masked prediction framework that works for text. The pretext task design question is always: what shortcut would a lazy model exploit, and how does the design eliminate it?`,
    recap: [
      `**SCARF (tabular):** corrupt fraction α of features with draws from each feature's *marginal* distribution; original vs corrupted = positive pair.`,
      `**Marginal draws look plausible** → can't detect by out-of-range; forces encoding inter-feature relationships (age vs years-since-retirement).`,
      `**Tabular SSL fails when features are heavily engineered or labels are plentiful:** break-even ≈ unlabeled 10× labeled + non-obvious correlations.`,
      `**Audio (wav2vec 2.0, HuBERT) is the big win outside text/vision:** speech's temporal structure maps onto masked prediction — 10 min labeled → competitive WER; separately, the 100-hr labeled subset matches SOTA with 100× less data.`,
      `**wav2vec quantizer** gives discrete symmetry-breaking targets (like BERT's vocab) to prevent collapse.`,
      `**Graph edge-drop is domain-dependent:** valid for social graphs, breaks molecular identity (bonds).`,
      `**Design question always:** what shortcut would a lazy model exploit, and how do you eliminate it?`,
    ],
  },
  {
    id: 'downstream_adaptation',
    title: 'Downstream Adaptation from SSL',
    subtitle: 'Linear probing, fine-tuning, prompt tuning, adapters, catastrophic forgetting, representation evaluation',
    difficulty: 'advanced',
    estimatedMin: 70,
    tags: ['fine-tuning', 'linear probe', 'prompt tuning', 'adapters', 'catastrophic forgetting', 'representation quality'],
    summary: `MAE achieves 68% ImageNet linear probe accuracy. SimCLR achieves 70%. On this metric, SimCLR wins. Full fine-tuning reverses the result: MAE reaches 83.6%, SimCLR reaches approximately 76%. The same pretrained representations, evaluated two ways, produce opposite rankings. This is not a measurement error—it is a direct counterexample to the assumption that linear probe accuracy predicts fine-tuning performance, and understanding why the divergence exists is more useful than memorizing the numbers.

The divergence comes from what each pretraining objective preserves. SimCLR's contrastive loss organizes representations around object-level similarities—which invariances to augmentation the model should learn. Representations become linearly separable by ImageNet category because the loss explicitly pushes same-class views together and different-class views apart. But the same loss discards fine-grained local detail: color invariance, crop invariance, texture invariance are all baked in. MAE's pixel reconstruction objective preserves that local detail because reconstruction at 75% masking requires encoding spatial relationships, texture, and pixel-level structure. This information is not linearly organized by ImageNet category—it is distributed across the representation in ways a frozen linear layer cannot access. A fine-tuned nonlinear network can access it, which is why MAE's fine-tuning performance exceeds SimCLR's.

The adaptation strategy is not purely a compute decision. Full fine-tuning on small labeled datasets risks catastrophic forgetting: the downstream supervised loss overwrites pretrained weights in a few hundred steps. The gradient signal from 1,000 labeled examples is insufficient to provide stable weight updates across the full model depth—each gradient step in the wrong direction is not corrected by subsequent steps because the dataset is too small to cover the loss landscape adequately. Fine-tuning on fewer than 10,000 examples without regularization is high risk. With 1,000 labeled examples and an MAE pretrained ViT, the right strategy is LoRA or adapters—not full fine-tuning—with a low learning rate and early stopping.

Layer-wise learning rate decay (LLRD) encodes a prior about what each layer should do. Lower layers encode general features (edges, textures, spatial relationships) that should not change for a new downstream task. Upper layers encode task-specific representations that should adapt. Scaling the learning rate by d^{L-l} (d ≈ 0.75) gives near-zero rates to lower layers and base rates to upper layers. This is standard practice for BERT and ViT fine-tuning precisely because it substantially reduces catastrophic forgetting without sacrificing adaptation capacity in the layers that need it.

**NOT this.** "Linear probe accuracy predicts fine-tuning performance" is directly refuted by MAE vs SimCLR. The linear probe measures whether downstream task structure is linearly separable in the pretrained space. MAE's representations are richer than SimCLR's but less linearly organized—a distinction the linear probe cannot detect. When choosing between SSL models for fine-tuning, run both evaluations; the linear probe alone will mislead.`,
    keyPoints: [
      `**Linear probe accuracy does not predict fine-tuning performance: MAE achieves 68% linear probe but 83.6% fine-tuned accuracy; SimCLR achieves 70% linear probe but only ~76% fine-tuned—the same representations rank opposite ways under the two evaluation protocols.**\n\nMAE's pixel reconstruction preserves fine-grained local information not linearly organized by ImageNet category. A frozen linear layer cannot access it; a fine-tuned nonlinear network can. SimCLR's contrastive loss organizes representations linearly by object-level similarity but discards color, texture, and local detail. Linear probe measures linear separability, not representation richness.`,
      `**Full fine-tuning on small labeled datasets risks catastrophic forgetting: downstream gradients from insufficient data overwrite pretrained weights faster than stable weight updates can form.**\n\nWith fewer than 10,000 examples, gradient signals are too sparse to cover the loss landscape. Each update overwrites pretrained structure without correction. With 1,000 labeled examples, LoRA or adapters with a low learning rate (1e-5 to 5e-5) and layer-wise learning rate decay preserve pretrained representations while adapting the parts that need to change.`,
      `**LoRA approximates weight updates as ΔW = AB (A ∈ ℝ^{d×r}, B ∈ ℝ^{r×d}, r << d), training only A and B while keeping W frozen—preserving pretrained representations while providing task-specific adaptation capacity at ~1% of full fine-tuning parameter count.**\n\nAt inference, W_new = W + AB merges the LoRA update with no latency overhead. This is why LoRA is the default for adapting large pretrained models to new tasks: zero catastrophic forgetting, minimal parameters, and adaptation capacity determined by rank r rather than full model depth.`,
      `**Prompt tuning keeps the entire model frozen and instead learns a small set of continuous "soft prompt" embeddings prepended to the input — no weight matrices are touched at all, so it trains even fewer parameters than LoRA.** It's the right choice with very few examples (under about 50) or when the new task is close to in-distribution with pretraining, needing no real internal feature shift — and it lets you serve many different tasks from one frozen backbone, each just swapping in its own soft prompt. LoRA is the better choice once the domain shift goes deeper than surface-level (new syntax, new modality) and you have 100+ examples to support adapting internal features, which prompt tuning cannot touch.`,
    ],
    interactivePrompt: `Before you touch the controls: MAE has lower linear probe accuracy than SimCLR but higher fine-tuning accuracy—what property of MAE's representations explains this reversal, and what does it tell you about when to trust linear probe as a metric?`,
    checkQuestions: [
      {
        q: `A ViT-B/16 model pretrained with MAE achieves 68% linear probe and 83.6% fine-tuned accuracy on ImageNet. A SimCLR model achieves 70% linear probe but only 76% fine-tuned. Your team has 1000 labeled examples. Which model do you choose for adaptation, and with what strategy?`,
        options: [
          `A) Always choose the model with the higher linear probe accuracy score (SimCLR here) — it is claimed to be the definitive predictor of downstream performance`,
          `B) With 1000 examples, full fine-tuning risks catastrophic forgetting; prefer MAE for texture tasks; use adapters or LoRA with low LR and early stopping`,
          `C) Choose MAE unconditionally here since its higher fine-tuned accuracy on the full ImageNet benchmark is assumed to directly predict performance at 1000 examples`,
          `D) With only 1000 examples, linear probing is presented as the only viable strategy — any form of fine-tuning is assumed to overfit immediately`,
        ],
        answer: `B`,
      },
      {
        q: `Select the two true statements about why early stopping is more critical during fine-tuning than during pretraining.`,
        options: [
          `A) Fine-tuning risks overfitting to the small labeled downstream dataset in a way pretraining on massive unlabeled data does not`,
          `B) Fine-tuning risks catastrophic forgetting, where downstream gradients overwrite the useful pretrained representations`,
          `C) Pretraining itself always requires more aggressive early stopping because its loss curve memorizes examples fastest`,
          `D) Fine-tuning never needs a held-out validation set, since the pretrained weights already regularize the model completely`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `LoRA and prompt tuning both keep the original model weights frozen. When would you choose one over the other for adapting a large language model to a new domain?`,
        options: [
          `A) Always choose LoRA over prompt tuning — it has strictly more trainable parameters and therefore always outperforms prompt tuning in every case`,
          `B) Choose LoRA for internal feature shifts (new syntax) with 100+ examples; choose prompt tuning when in-distribution or serving many tasks from one model`,
          `C) Choose prompt tuning specifically when compute budget is limited; choose LoRA specifically when GPU memory is the limiting constraint instead`,
          `D) LoRA is designed exclusively for vision models while prompt tuning is designed exclusively for language models — the two are not interchangeable`,
        ],
        answer: `B`,
      },
      {
        q: `A team uses k-NN accuracy on a validation set as the primary metric for evaluating SSL representation quality before fine-tuning. What does this metric miss that linear probe catches, and vice versa?`,
        options: [
          `A) k-NN and linear probe measure exactly the same underlying property — local neighborhood geometry and global linear separability turn out to be mathematically equivalent`,
          `B) k-NN misses global linear structure and per-dimension class signal; linear probe misses non-linear cluster structure — the two metrics are complementary`,
          `C) k-NN uniquely catches memorization of training examples that linear probe entirely misses, because k-NN directly compares against stored training embeddings`,
          `D) Linear probe is always a strictly better metric than k-NN in every case — any representation scoring well on k-NN will necessarily also score well on linear probe`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `MAE vs SimCLR is the direct counterexample to trusting linear probe as a proxy for fine-tuning performance: lower linear probe, higher fine-tuning accuracy, because MAE's pixel reconstruction preserves fine-grained local information that is not linearly organized but is accessible to a fine-tuned nonlinear network. With 1,000 labeled examples, full fine-tuning erases the pretrained representations that justified using SSL—use LoRA or adapters with low learning rate and early stopping.`,
    recap: [
      `**Linear probe ≠ fine-tuning:** MAE 68% probe / 83.6% fine-tuned vs SimCLR 70% probe / ~76% — opposite ranks.`,
      `**Why:** MAE preserves fine-grained local detail not linearly organized; a fine-tuned nonlinear net accesses it, a frozen linear layer can't.`,
      `**Full fine-tuning on <10K examples risks catastrophic forgetting:** sparse gradients overwrite pretrained weights without correction.`,
      `**With ~1,000 labels: use LoRA/adapters, low LR (1e-5–5e-5), early stopping.**`,
      `**LoRA:** ΔW = AB (r ≪ d), train A,B only; ~1% params, zero forgetting, merges at inference (W+AB) with no latency.`,
      `**LLRD (d≈0.75, scale d^{L-l}):** near-zero LR low layers (general), base LR upper layers (task-specific).`,
      `**LoRA vs prompt tuning:** LoRA for internal feature shifts / 100+ examples; prompt tuning for in-distribution tasks, <50 examples, many tasks from one model.`,
    ],
  },
]
