// Pricing Analytics — KNOW foundation track (SKELETON).
//
// This track is SPECCED but NOT YET AUTHORED. Each entry is a module *outline*:
// a real title, subtitle, tags, and a 1–2 line spec of what the authored module
// will teach. Every module carries `skeleton: true` so the runner renders an
// explicit "in development" state instead of fake full content.
//
// To ship a module: author summary / keyPoints / takeaway / checkQuestions /
// recap / interactiveId exactly as the recsysModules.js modules do, then flip
// `skeleton` to false (or remove it). The runner auto-detects the flag.
//
// Canon covered: price elasticity of demand, dynamic/surge pricing, price
// optimization under constraints, causal price experiments (A/B + geo +
// switchback), promotion/discount uplift, competitive/willingness-to-pay
// modeling, revenue-vs-margin objective design.

export const PRICING_MODULES = [
  {
    id: 'price_elasticity_of_demand',
    title: 'Price Elasticity of Demand',
    subtitle: 'Why %ΔQ / %ΔP is the master parameter — and why a naive regression of quantity on price estimates the wrong thing',
    difficulty: 'foundational',
    estimatedMin: 24,
    tags: ['Pricing', 'elasticity', 'demand curve', 'log-log'],
    skeleton: true,
    spec: `Define elasticity ε = %ΔQ / %ΔP and the log-log demand model where the coefficient IS the elasticity. Show why observational price/quantity data is endogenous (prices rise when demand is high → upward-biased, sometimes positive, "elasticity"), motivating experiments/instruments. Cover the elastic (|ε|>1) vs inelastic (|ε|<1) regimes and what each implies for whether a price cut grows or shrinks revenue.`,
  },
  {
    id: 'revenue_vs_margin_objective',
    title: 'Revenue vs Margin: Choosing the Objective',
    subtitle: 'The single most consequential pricing decision is what you are optimizing — top-line revenue, contribution margin, or long-term customer value',
    difficulty: 'foundational',
    estimatedMin: 22,
    tags: ['Pricing', 'objective design', 'contribution margin', 'unit economics'],
    skeleton: true,
    spec: `Contrast the profit-maximizing price (marginal revenue = marginal cost) with the revenue-maximizing price (|ε|=1) and show they only coincide at zero marginal cost. Walk the contribution-margin identity (p − c) × Q and why maximizing revenue can destroy margin. Frame objective choice as a product/strategy decision (share grab vs harvest), the pricing analog of RecSys value-model weighting.`,
  },
  {
    id: 'price_optimization_under_constraints',
    title: 'Price Optimization Under Constraints',
    subtitle: 'From a demand curve to a chosen price — with fairness, competitive, inventory, and legal constraints turning it into a constrained optimization',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['Pricing', 'optimization', 'constraints', 'price bounds'],
    skeleton: true,
    spec: `Set up argmax over price of expected profit given an estimated demand function, then layer real constraints: price floors/ceilings, min-margin guarantees, price-consistency across a catalog, capacity/inventory limits, and no-surge-above-X regulatory caps. Show why the unconstrained optimum is rarely shippable and how Lagrangian/bounded search handles it.`,
  },
  {
    id: 'dynamic_and_surge_pricing',
    title: 'Dynamic & Surge Pricing',
    subtitle: 'Real-time price as a control signal for a supply/demand imbalance — matching, not just extracting — and how it goes wrong',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['Pricing', 'dynamic pricing', 'surge', 'market clearing'],
    skeleton: true,
    spec: `Frame surge as a market-clearing controller: raise price to suppress demand and pull in supply until the imbalance closes (rideshare, hotels, airlines). Cover the feedback loop (price → demand → price) and its instability, the fairness/PR failure modes (disaster surge), and why caps + smoothing + explainability are load-bearing. Contrast personalized dynamic pricing with segment-level dynamic pricing.`,
  },
  {
    id: 'causal_price_experiments',
    title: 'Causal Price Experiments: A/B, Geo & Switchback',
    subtitle: 'Why you almost never A/B test price at the user level, and how geo holdouts and switchback designs recover an unbiased elasticity',
    difficulty: 'advanced',
    estimatedMin: 28,
    tags: ['Pricing', 'experimentation', 'geo experiments', 'switchback'],
    skeleton: true,
    spec: `Explain why per-user price randomization is often illegal/unfair and leaks (users compare prices), breaking SUTVA. Introduce geo-level experiments (randomize price by market, difference-in-differences / synthetic control readout) and switchback designs (randomize price over time windows) for marketplaces with strong interference. Tie back to elasticity: the experiment is how you get the unbiased %ΔQ / %ΔP.`,
  },
  {
    id: 'promotion_and_discount_uplift',
    title: 'Promotion & Discount Uplift',
    subtitle: 'Measuring the INCREMENTAL effect of a discount — separating true uplift from cannibalization, pull-forward, and buyers who would have bought anyway',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['Pricing', 'uplift modeling', 'incrementality', 'cannibalization'],
    skeleton: true,
    spec: `Define discount uplift as incremental units caused by the promo, not gross units sold at the discounted price. Cover the three leakages that inflate naive ROI: baseline sales (would-have-bought), pull-forward (borrowing future demand), and cannibalization (stealing from full-price SKUs). Introduce uplift/heterogeneous-treatment-effect modeling to target discounts only at persuadable buyers.`,
  },
  {
    id: 'willingness_to_pay_and_competition',
    title: 'Willingness-to-Pay & Competitive Modeling',
    subtitle: 'Estimating the price a segment will bear, and pricing in a market where competitors respond to your moves',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['Pricing', 'willingness-to-pay', 'competitive response', 'segmentation'],
    skeleton: true,
    spec: `Cover WTP estimation (surveys/Van Westendorp, choice models/conjoint, revealed-preference from experiments) and segment-level demand curves enabling differential pricing. Then add competition: reaction functions, price-matching dynamics, and why a naive local optimum ignores that competitors re-price. Frame competitive equilibrium vs one-shot optimization and the reputational cost of price wars.`,
  },
]
