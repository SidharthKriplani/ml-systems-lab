// Pricing Analytics — KNOW foundation track (AUTHORED).
//
// All 7 modules are fully authored to S-tier depth: summary / keyPoints /
// takeaway / checkQuestions / recap / figures, matching the schema and voice of
// recsysModules.js. No module carries `skeleton: true`.
//
// Canon covered: price elasticity of demand, revenue-vs-margin objective design,
// price optimization under constraints, dynamic/surge pricing, causal price
// experiments (A/B + geo + switchback), promotion/discount uplift, and
// willingness-to-pay / competitive modeling.

export const PRICING_MODULES = [
  {
    id: 'price_elasticity_of_demand',
    title: 'Price Elasticity of Demand',
    subtitle: 'Why %ΔQ / %ΔP is the master parameter — and why a naive regression of quantity on price estimates the wrong thing',
    difficulty: 'foundational',
    estimatedMin: 24,
    tags: ['Pricing', 'elasticity', 'demand curve', 'log-log'],
    summary: `Every pricing decision reduces to one number: if I move price by 1%, how much does quantity move? That number is the **elasticity** ε, and almost every mistake in pricing analytics is either not knowing ε or estimating it from data that cannot possibly reveal it.

[FIGURE: elasticity]

---

**Elasticity is a ratio of percent changes, and that is deliberate.** ε = %ΔQ / %ΔP. Using percentages instead of raw units makes ε unit-free: it doesn't matter whether Q is in cups of coffee or gigawatt-hours, or whether P is in dollars or rupees. Demand curves slope down, so ε is negative; people quote |ε|. |ε| > 1 is **elastic** (quantity reacts more than price — a 1% cut lifts volume more than 1%), |ε| < 1 is **inelastic** (quantity barely moves), |ε| = 1 is **unit elastic**.

---

**The clean way to estimate it is a log-log demand model, where the coefficient IS the elasticity.** Fit log Q = α + β·log P. Then β = d(log Q)/d(log P) = %ΔQ / %ΔP = ε — a *constant* elasticity across the range, which is why log-log is the workhorse specification. A linear Q = a − b·P instead gives an elasticity that changes at every point (ε = −b·P/Q), which is fine but less interpretable. The log-log slope reads off directly as the master parameter.

---

**The trap: regressing observed quantity on observed price estimates the wrong thing.** Firms *raise* prices exactly when demand is high (peak season, hot product) and cut them when demand is soft. So in observational data, high prices coincide with high quantities — the naive regression can return a *shallow, even positive* "elasticity," implying "raise price to sell more." That is **endogeneity**: price is correlated with the demand shocks in the error term. This is why real elasticity comes from **experiments or instruments** (a supply-side cost shock that moves price but not demand), not from a scatterplot of what happened.`,
    interactivePrompt: `Before you touch the controls: you fit log Q on log P from a year of sales and get a slope of +0.2 — implying higher prices sell more. Which real mechanism produces that sign, and why does it mean your estimate is not the elasticity?`,
    keyPoints: [
      `**Elasticity is the unit-free master parameter: ε = %ΔQ / %ΔP.** Percent changes make it comparable across products and currencies. |ε| > 1 = elastic (volume reacts strongly), |ε| < 1 = inelastic (volume barely moves). It is negative for normal goods; people quote the magnitude.`,
      `**The log-log model makes the coefficient the elasticity.** Fit log Q = α + β·log P and β = ε directly, constant across the price range. A linear demand curve has a *changing* elasticity (ε = −b·P/Q), which is harder to reason about — log-log is the default because the slope IS the answer.`,
      `**Observational price/quantity data is endogenous.** Firms raise price when demand is high, so high prices and high quantities co-occur in the record. A naive regression absorbs that and returns a biased, sometimes positive, "elasticity." Price is correlated with the demand shock — the textbook endogeneity failure.`,
      `**Unbiased elasticity needs experiments or instruments.** Randomize price (geo/switchback tests) or use an instrument that shifts price for a reason unrelated to demand (a cost or tax shock). Both break the price↔demand-shock correlation so the estimated %ΔQ / %ΔP is causal.`,
    ],
    takeaway: `Elasticity ε = %ΔQ / %ΔP is the single number that decides whether a price move grows or shrinks volume, and the log-log demand model reads it off as a slope. But you cannot regress observed quantity on observed price — firms set price in response to demand, so that estimate is endogenously biased (even positive). Real elasticity comes from an experiment or an instrument that moves price independently of demand.`,
    checkQuestions: [
      {
        q: `A product has estimated |ε| = 1.6. Select the two correct statements about what happens if you cut price by 5%.`,
        options: [
          `A) With |ε| = 1.6 > 1 the good is elastic, so a 5% cut raises quantity by roughly 8%, more than offsetting the per-unit price loss.`,
          `B) Because quantity gains outweigh the per-unit loss when demand is elastic, total revenue increases from this cut.`,
          `C) Revenue falls regardless, since cutting price always reduces revenue whenever marginal cost exceeds zero.`,
          `D) Revenue is unchanged, because elasticity of 1.6 sits below the unit-elastic threshold of 2.0 where price and quantity offset.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You regress log(units) on log(price) across a year of store data and get a slope of +0.3. What is the most likely explanation?`,
        options: [
          `A) The good is a Giffen good: for strongly inferior staples, the income effect overwhelms the substitution effect, so demand genuinely rises with price.`,
          `B) Endogeneity: the store raised prices in high-demand periods, so price correlates with the unobserved demand shock — the slope isn't a causal elasticity.`,
          `C) The log-log specification is wrong here; switching to a quadratic price term would flip the sign back to the expected negative value.`,
          `D) Measurement error in the price variable systematically attenuated the true negative slope toward zero and pushed it past zero into strongly positive territory over the full year of data.`,
        ],
        answer: `B`,
      },
      {
        q: `Why is a log-log demand model usually preferred over a linear one when the goal is to report a single elasticity number?`,
        options: [
          `A) Log-log always achieves a higher R² than a linear fit because the log transform removes heteroskedasticity from the residuals entirely.`,
          `B) The slope in log-log form is itself the elasticity and stays constant across prices; a linear model's elasticity changes at every point.`,
          `C) Linear models cannot represent downward-sloping demand curves, since a negative slope violates the non-negativity constraint on quantity.`,
          `D) Log-log transformation removes endogeneity bias automatically, since taking logarithms breaks the correlation between price and demand shocks.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**ε = %ΔQ / %ΔP is the master parameter:** unit-free, negative for normal goods. |ε| > 1 elastic (volume reacts strongly), |ε| < 1 inelastic, |ε| = 1 unit elastic.`,
      `**Log-log demand makes the coefficient the elasticity:** fit log Q = α + β·log P → β = ε, constant across the range. Linear demand has a changing elasticity ε = −b·P/Q.`,
      `**Observational data is endogenous:** firms raise price when demand is high, so high prices co-occur with high quantities → naive regression returns a biased, even positive, "elasticity." Price correlates with the demand shock.`,
      `**Causal ε needs an experiment or instrument:** randomize price (geo/switchback) or use a supply-side cost/tax shock that moves price but not demand. That breaks the price↔demand correlation.`,
      `**Elasticity decides the revenue direction of a price move:** elastic → a cut grows revenue; inelastic → a cut shrinks it. Getting the sign of this decision wrong is the costliest pricing error.`,
    ],
    figures: {
      elasticity: `<svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="34" y1="14" x2="34" y2="96" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="34" y1="96" x2="346" y2="96" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="30" y="12" text-anchor="end" fill="var(--ink-mid)" font-size="8">P</text>
  <text x="346" y="108" text-anchor="end" fill="var(--ink-mid)" font-size="8">Q</text>
  <line x1="46" y1="22" x2="180" y2="90" stroke="var(--prime)" stroke-width="2"/>
  <text x="70" y="34" fill="var(--prime)" font-size="8" font-weight="700">elastic |ε|&gt;1</text>
  <line x1="210" y1="26" x2="340" y2="90" stroke="var(--ink-mid)" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="250" y="38" fill="var(--ink-mid)" font-size="8" font-weight="700">inelastic |ε|&lt;1</text>
  <text x="34" y="115" fill="var(--ink-low)" font-size="7.5">ε = %ΔQ / %ΔP · log-log slope = ε · steep = big volume response to price</text>
</svg>`,
    },
  },
  {
    id: 'revenue_vs_margin_objective',
    title: 'Revenue vs Margin: Choosing the Objective',
    subtitle: 'The single most consequential pricing decision is what you are optimizing — top-line revenue, contribution margin, or long-term customer value',
    difficulty: 'foundational',
    estimatedMin: 22,
    tags: ['Pricing', 'objective design', 'contribution margin', 'unit economics'],
    summary: `Before any elasticity math, someone has to answer a question that feels like a formality but decides everything downstream: *what are we maximizing?* Revenue and profit peak at **different prices**, and a model that quietly optimizes the wrong one will look successful while destroying value.

[FIGURE: objective]

---

**The two optimal prices are different, and the gap is the marginal cost.** Revenue is P·Q, maximized where marginal revenue = 0, which happens exactly at **|ε| = 1** — the unit-elastic point. Profit is (P − c)·Q, maximized where **marginal revenue = marginal cost (MR = MC)**. These coincide *only when c = 0*. With any positive unit cost, the profit-maximizing price is strictly **higher** than the revenue-maximizing price (you don't want to sell cheap units that barely clear cost). So "we grew revenue" and "we grew profit" can be the results of opposite price moves.

---

**Contribution margin is the identity that exposes the trap.** Contribution = (P − c) × Q. A price cut can raise Q enough to grow revenue P·Q while the per-unit margin (P − c) collapses — so revenue is up but contribution is down. Example: c = 6. At P = 10, margin 4 × 1000 units = 4,000. Cut to P = 8, sell 1,400 units: revenue jumps 10,000 → 11,200 (looks great), but contribution 2 × 1,400 = 2,800 — you sold 40% more and made 30% *less* money. Revenue is a vanity target when c is meaningful.

---

**So objective choice is a strategy decision, not a math default.** Maximizing revenue/share makes sense in a land-grab (network effects, near-zero marginal cost, winner-take-most). Maximizing contribution makes sense in a harvest phase or a cost-heavy business. And often the true objective is **long-term customer value** — a low intro price that loses margin now but raises retention and lifetime value. This is the pricing analog of RecSys value-model weighting: the *weights on the objective* are a product decision the model then optimizes faithfully. Pick them wrong and every downstream number is precisely optimized toward the wrong destination.`,
    interactivePrompt: `Before you touch the controls: your unit cost is \$6. You find the revenue-maximizing price and ship it. Why is the profit-maximizing price necessarily higher, and what does shipping the revenue-max price do to contribution margin?`,
    keyPoints: [
      `**Revenue and profit peak at different prices.** Revenue P·Q is maximal at |ε| = 1 (MR = 0); profit (P − c)·Q is maximal at MR = MC. They coincide only when marginal cost c = 0. With c > 0 the profit-maximizing price is strictly higher, so revenue-max and profit-max can be opposite moves.`,
      `**Contribution = (P − c) × Q is the identity that catches the trap.** A price cut can raise revenue while margin (P − c) collapses. Selling 40% more units at a thin margin routinely yields *less* total contribution — revenue growth with margin destruction is a common and dangerous outcome.`,
      `**Objective choice is strategy, not a default.** Revenue/share-max fits a land-grab (near-zero cost, network effects, winner-take-most). Contribution-max fits a harvest phase or cost-heavy unit economics. Long-term customer value (LTV) can justify losing margin now for retention later.`,
      `**This is the pricing analog of value-model weighting.** The objective's weights are a product decision; the optimizer then faithfully drives toward whatever you specified. Choose revenue when you meant profit and the model will "succeed" while quietly eroding the business.`,
    ],
    takeaway: `The most consequential pricing choice is the objective itself: revenue P·Q peaks at |ε| = 1 while profit (P − c)·Q peaks at MR = MC, and they coincide only at zero marginal cost — so with real costs the two optimal prices differ. A price cut that grows revenue can shrink contribution (P − c)×Q, so revenue is a vanity metric whenever c matters. Picking revenue vs margin vs LTV is a strategy decision the model then optimizes faithfully.`,
    checkQuestions: [
      {
        q: `Unit cost c = \$6. Price cut from \$10 to \$8 raises volume from 1,000 to 1,400 units. Select the two correct statements about this outcome.`,
        options: [
          `A) Revenue rose from 10,000 to 11,200 as a direct result of the higher unit volume.`,
          `B) Contribution margin fell from 4,000 to 2,800 despite the revenue increase.`,
          `C) Contribution margin also rose, from 4,000 to 4,480, tracking the revenue gain.`,
          `D) The price cut was strictly dominated because both revenue and contribution declined.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Under what condition does the revenue-maximizing price equal the profit-maximizing price?`,
        options: [
          `A) When demand is perfectly inelastic at |ε| = 0, since then marginal revenue never crosses zero and the two objectives converge identically.`,
          `B) When marginal cost c = 0, so profit reduces to revenue and both peak at the same |ε| = 1 point.`,
          `C) When elasticity equals exactly |ε| = 2, the textbook midpoint of the elastic range where marginal cost effects theoretically cancel out entirely regardless of the demand curve's underlying shape.`,
          `D) Never — the two optimal prices are structurally different regardless of cost, because they solve unrelated first-order conditions.`,
        ],
        answer: `B`,
      },
      {
        q: `A subscription startup deliberately prices below the contribution-maximizing point in its first two years. What objective is this most consistent with, and is it necessarily irrational?`,
        options: [
          `A) It is irrational — any price set below the contribution-maximizing point destroys shareholder value by definition, with absolutely no exceptions ever permitted under any circumstance.`,
          `B) It likely targets long-term customer value: a low intro price sacrifices near-term margin to raise retention, rational under network effects.`,
          `C) It is maximizing revenue, which is always the objectively correct target for early-stage startups regardless of their unit economics.`,
          `D) It is a pricing bug — the optimizer minimized the profit objective by mistake instead of maximizing it, a common sign-flip error.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Revenue and profit peak at different prices:** revenue P·Q maxes at |ε| = 1 (MR = 0); profit (P − c)·Q maxes at MR = MC. They coincide only when c = 0.`,
      `**Positive marginal cost → profit-max price is strictly higher** than the revenue-max price. "Grew revenue" and "grew profit" can be opposite price moves.`,
      `**Contribution = (P − c) × Q exposes the trap:** a cut can raise revenue while (P − c) collapses. Selling 40% more units at a thin margin can yield 30% *less* money.`,
      `**Objective choice is a strategy decision:** revenue/share for a land-grab (near-zero cost, network effects), contribution for a harvest or cost-heavy business, LTV when retention pays back the margin.`,
      `**It is the pricing analog of value-model weighting:** the weights are a product decision; the optimizer faithfully drives toward whatever you specify — so a wrong objective "succeeds" while destroying value.`,
    ],
    figures: {
      objective: `<svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="34" y1="14" x2="34" y2="96" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="34" y1="96" x2="346" y2="96" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="30" y="12" text-anchor="end" fill="var(--ink-mid)" font-size="8">$</text>
  <text x="346" y="108" text-anchor="end" fill="var(--ink-mid)" font-size="8">price</text>
  <path d="M40,90 Q150,20 200,44 T340,90" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <text x="120" y="30" fill="var(--prime)" font-size="8" font-weight="700">revenue P·Q</text>
  <path d="M120,90 Q220,34 250,52 T340,84" fill="none" stroke="var(--ink-mid)" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="255" y="42" fill="var(--ink-mid)" font-size="8" font-weight="700">profit (P−c)·Q</text>
  <line x1="150" y1="26" x2="150" y2="96" stroke="var(--ink-low)" stroke-width="0.8" stroke-dasharray="2 2"/>
  <line x1="228" y1="40" x2="228" y2="96" stroke="var(--ink-low)" stroke-width="0.8" stroke-dasharray="2 2"/>
  <text x="150" y="115" text-anchor="middle" fill="var(--ink-low)" font-size="7">|ε|=1</text>
  <text x="228" y="115" text-anchor="middle" fill="var(--ink-low)" font-size="7">MR=MC</text>
  <text x="300" y="115" text-anchor="end" fill="var(--ink-low)" font-size="7">gap = marginal cost c</text>
</svg>`,
    },
  },
  {
    id: 'price_optimization_under_constraints',
    title: 'Price Optimization Under Constraints',
    subtitle: 'From a demand curve to a chosen price — with fairness, competitive, inventory, and legal constraints turning it into a constrained optimization',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['Pricing', 'optimization', 'constraints', 'price bounds'],
    summary: `Once you have a demand curve and an objective, "find the best price" looks like one line of calculus: argmax over P of (P − c)·Q(P). In production it almost never is, because the unconstrained optimum is usually a price you are **not allowed to ship**. The real problem is a *constrained* optimization, and the constraints are where the engineering lives.

[FIGURE: constrained]

---

**Start with the clean unconstrained problem.** Given estimated demand Q(P) and cost c, maximize expected profit π(P) = (P − c)·Q(P). Set dπ/dP = 0 → this recovers the standard markup rule P* = c·|ε| / (|ε| − 1) when elasticity is constant. That P* is the textbook answer — and it is frequently outside the feasible set: too high to be fair or legal, too low to protect margin, or inconsistent with sibling products.

---

**Then layer the constraints that make it shippable — this is the actual job.** Real optimizers add: **price floors/ceilings** (regulatory caps, MAP agreements, brand-minimum prices); a **min-margin guarantee** (P ≥ c·(1 + m), never sell below a floor markup); **catalog consistency** (a 500ml pack can't cost more per-ml than the 1L; variants must order sensibly); **capacity/inventory limits** (if you can only fulfill K units, don't set a price whose Q(P) far exceeds K); and **no-surge-above-X** legal caps in regulated markets. Each turns the free argmax into a bounded/constrained one.

---

**Mechanically, you handle it with bounded search or Lagrangian methods.** If the constraint is a simple box (P ∈ [P_min, P_max]), clip: the constrained optimum is the unconstrained P* if it's inside the box, else the nearer boundary (profit is concave, so the best feasible price is the closest allowed one to P*). For coupled constraints (a total-inventory or catalog-consistency limit spanning many prices), use a **Lagrangian**: add λ·(constraint) to the objective, and λ is the *shadow price* — how much profit one more unit of slack (one more unit of inventory, one more dollar of allowed ceiling) would buy. The headline lesson: the unconstrained optimum is a starting point, not the answer, and the binding constraints — not the calculus — usually determine the shipped price.`,
    interactivePrompt: `Before you touch the controls: your unconstrained profit-maximizing price is \$14, but a regulatory cap forbids charging above \$11. Because profit is concave in price, where does the best *feasible* price land, and why isn't it somewhere in the middle?`,
    keyPoints: [
      `**The unconstrained problem is argmax over P of (P − c)·Q(P).** With constant elasticity this gives the markup rule P* = c·|ε|/(|ε| − 1). That P* is the textbook answer and is frequently outside the feasible set — too high, too low, or inconsistent with sibling SKUs.`,
      `**Constraints are the real job: floors/ceilings, min-margin, catalog consistency, capacity, legal caps.** A min-margin guarantee (P ≥ c·(1+m)), a per-unit consistency rule across pack sizes, an inventory limit K, and regulatory no-surge caps each shrink the feasible region — and the binding one usually sets the shipped price.`,
      `**For box constraints, clip to the boundary.** Profit is concave in P, so if the unconstrained P* violates [P_min, P_max], the best feasible price is the nearer boundary — not an interior compromise. Moving toward P* is always improving until you hit the wall.`,
      `**For coupled constraints, use a Lagrangian and read λ as a shadow price.** Adding λ·(constraint) to the objective, λ tells you the marginal profit of relaxing the constraint by one unit — the value of one more unit of inventory or one more dollar of allowed ceiling. It converts "what's the price" into "what's the constraint worth."`,
    ],
    takeaway: `Choosing a price is a constrained optimization, not a one-line argmax: the unconstrained profit-maximizer P* = c·|ε|/(|ε|−1) is a starting point that usually violates floors, ceilings, min-margin, catalog-consistency, capacity, or legal caps. Because profit is concave, box constraints resolve by clipping to the nearer boundary; coupled constraints resolve with a Lagrangian whose multiplier λ is the shadow price of relaxing the constraint. The binding constraint, not the calculus, typically determines the shipped price.`,
    checkQuestions: [
      {
        q: `Your unconstrained profit-maximizing price is \$14, but a regulatory ceiling caps price at \$11. Where is the best feasible price?`,
        options: [
          `A) At \$11 — profit is concave, so on [P_min, \$11] profit keeps rising toward \$14, making the nearest allowed price to the optimum best.`,
          `B) At the midpoint \$12.50, since regulatory caps are conventionally split evenly between the unconstrained optimum and the legal ceiling.`,
          `C) At \$14 — a regulatory ceiling only restricts the price for tax-reporting purposes, not the price actually charged to customers.`,
          `D) At P_min — a binding ceiling on one side of the price range always forces the optimum to jump to the opposite boundary instead.`,
        ],
        answer: `A`,
      },
      {
        q: `In a Lagrangian formulation π(P) + λ·(K − Q(P)) for an inventory limit K, select the two correct statements about the multiplier λ at the optimum.`,
        options: [
          `A) λ is the shadow price of capacity: the marginal profit gained from one additional unit of available inventory.`,
          `B) λ equals zero whenever the capacity constraint is slack rather than actively binding at the chosen price.`,
          `C) λ is always numerically equal to the price elasticity of demand evaluated at the optimal price.`,
          `D) λ represents the statistical probability that the constraint gets violated once the pricing model is deployed.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why is a catalog-consistency constraint (a 1L pack must not cost more per-ml than a 500ml pack) harder to handle than a simple price ceiling?`,
        options: [
          `A) It isn't harder — catalog consistency is just another independent box constraint applied separately to each SKU's own price, with no coupling at all.`,
          `B) It couples multiple prices together into one joint constraint across variants, requiring a Lagrangian instead of per-item clipping.`,
          `C) Consistency constraints make the profit function non-concave everywhere, so no feasible pricing optimum can ever be found.`,
          `D) It requires estimating a completely separate demand curve for every milliliter of product, which is statistically infeasible.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Unconstrained problem:** argmax over P of (P − c)·Q(P). Constant elasticity → markup rule P* = c·|ε|/(|ε| − 1). This P* is a starting point, not the shipped price.`,
      `**Constraints are the real job:** price floors/ceilings, min-margin (P ≥ c·(1+m)), catalog consistency across pack sizes, capacity/inventory K, and legal no-surge caps. The binding one usually sets the price.`,
      `**Box constraints → clip to the boundary:** profit is concave in P, so a violated optimum resolves to the nearer allowed bound, never an interior compromise.`,
      `**Coupled constraints → Lagrangian:** add λ·(constraint); λ is the shadow price — the marginal profit of relaxing the constraint by one unit (one more unit of inventory, one more dollar of ceiling).`,
      `**Headline:** the unconstrained optimum is where you start; the binding constraint — not the calculus — is usually what determines the price you actually ship.`,
    ],
    figures: {
      constrained: `<svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="34" y1="14" x2="34" y2="96" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="34" y1="96" x2="346" y2="96" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="30" y="12" text-anchor="end" fill="var(--ink-mid)" font-size="8">profit</text>
  <text x="346" y="108" text-anchor="end" fill="var(--ink-mid)" font-size="8">price</text>
  <path d="M50,92 Q200,10 330,92" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="230" cy="30" r="3" fill="var(--prime)"/>
  <text x="238" y="26" fill="var(--prime)" font-size="8" font-weight="700">unconstrained P*</text>
  <rect x="50" y="14" width="120" height="82" fill="var(--prime-faint)" opacity="0.5"/>
  <line x1="170" y1="14" x2="170" y2="96" stroke="var(--amber,#d97706)" stroke-width="1.5"/>
  <circle cx="170" cy="44" r="3" fill="var(--amber,#d97706)"/>
  <text x="118" y="112" text-anchor="middle" fill="var(--ink-low)" font-size="7">feasible: P ≤ cap</text>
  <text x="176" y="58" fill="var(--amber,#d97706)" font-size="8" font-weight="700">best feasible = boundary</text>
</svg>`,
    },
  },
  {
    id: 'dynamic_and_surge_pricing',
    title: 'Dynamic & Surge Pricing',
    subtitle: 'Real-time price as a control signal for a supply/demand imbalance — matching, not just extracting — and how it goes wrong',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['Pricing', 'dynamic pricing', 'surge', 'market clearing'],
    summary: `Surge pricing looks like greed and is often defended as revenue extraction, but the correct mental model is a **controller**: price is the actuator a marketplace uses to close a real-time gap between demand and supply. When 500 riders want a car and 200 drivers are online, *something* has to ration the 200 cars — surge is the mechanism that does it with price instead of a random queue.

[FIGURE: surge]

---

**Surge is a market-clearing feedback loop, not a static price.** Raise price → some riders drop out (demand falls) and more drivers log on to chase the higher fare (supply rises) → the imbalance shrinks. The system nudges price up until demand ≈ supply at the new price. The same logic runs hotels (raise rates when occupancy nears full), airlines (fare buckets that rise as seats sell), and any capacity-constrained marketplace. The goal is **matching** — clearing the market so the people who most value a ride get one — not simply charging more.

---

**The feedback loop is also where it breaks.** Price → demand → price is a closed loop, and closed loops can oscillate: a surge suppresses demand, price drops, demand floods back, price spikes again — a control-instability problem, not a pricing problem. The fixes are control-theory fixes: **smoothing** (rate-limit how fast the multiplier moves), **hysteresis/deadbands** (don't re-price on noise), and **caps** to bound the actuator. Without them the multiplier flaps and the user experience whipsaws.

---

**And the failure modes are as much social as technical.** A surge that is *economically correct* during a disaster or emergency is a reputational catastrophe — "10× fares during a hurricane" is efficient market clearing and an unforgivable headline. So real systems bolt on **regulatory caps**, **surge disablement** in emergencies, and **explainability** ("prices are higher due to demand") because an opaque 3.4× multiplier reads as exploitation. A final design axis: **personalized** dynamic pricing (a price tuned to *this user's* WTP) is powerful but legally and ethically fraught — it edges toward discrimination — so most marketplaces surge at the **segment/geo level** (this area, this time), not per individual.`,
    interactivePrompt: `Before you touch the controls: you wire price directly to the live demand/supply ratio with no smoothing. Describe the oscillation that results, and name the two control-theory fixes that damp it.`,
    keyPoints: [
      `**Surge is a market-clearing controller, not pure extraction.** Price is the actuator that rations scarce supply: raise it to suppress demand and attract more supply until demand ≈ supply. The objective is matching the highest-value riders to the available cars, the same mechanism hotels and airlines use as occupancy fills.`,
      `**The price → demand → price feedback loop can oscillate.** A closed control loop with no damping whipsaws: surge kills demand, price drops, demand floods back, price spikes again. This is a control-stability problem — fix it with smoothing (rate limits), hysteresis/deadbands (ignore noise), and caps that bound the actuator.`,
      `**Fairness/PR failure modes are load-bearing, not cosmetic.** Economically correct disaster surge is a reputational catastrophe. Systems add regulatory caps, emergency surge disablement, and explainability ("higher due to demand") because an opaque multiplier reads as exploitation regardless of its efficiency.`,
      `**Personalized dynamic pricing is powerful but fraught; segment/geo pricing is the norm.** Pricing to an individual's WTP edges toward discrimination and legal risk, so most marketplaces vary price by area and time (segment level) rather than per user — a deliberate ethical/legal guardrail, not a modeling limitation.`,
    ],
    takeaway: `Surge pricing is best understood as a controller that uses price to clear a real-time supply/demand imbalance — raising price suppresses demand and pulls in supply until the market matches, which is efficient rationing, not just extraction. But the price→demand→price loop can oscillate, so smoothing, hysteresis, and caps are required for stability; and because economically-correct surge (e.g., during a disaster) is a reputational disaster, regulatory caps, emergency disablement, explainability, and segment-level (not personalized) pricing are essential guardrails.`,
    checkQuestions: [
      {
        q: `Select the two correct statements about why a rideshare app raises fares when many riders and few drivers are online.`,
        options: [
          `A) Raising price during high demand rations scarce supply toward the riders who value it most.`,
          `B) The higher fare also pulls more drivers online, increasing supply until the gap closes.`,
          `C) Surge pricing is purely a profit-extraction tactic with no effect on driver supply.`,
          `D) Surge multipliers are calculated per individual rider based on that rider's payment history.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You wire the surge multiplier directly to the instantaneous demand/supply ratio with no damping. What is the most likely failure?`,
        options: [
          `A) The price converges instantly and smoothly to the exact market-clearing level with no transient behavior of any kind whatsoever.`,
          `B) Oscillation: the multiplier spikes, demand drops, it collapses, then demand returns and it spikes again — a closed-loop instability.`,
          `C) The multiplier increases monotonically forever, since the ratio has no natural ceiling once demand starts exceeding supply.`,
          `D) Nothing happens — surge systems are inherently open-loop control systems that structurally cannot ever oscillate under any configuration.`,
        ],
        answer: `B`,
      },
      {
        q: `Why do most marketplaces surge at the geo/segment level rather than personalizing price to each user's estimated willingness-to-pay?`,
        options: [
          `A) Segment-level pricing is strictly more profitable than personalized pricing in every possible market condition and scenario imaginable.`,
          `B) Personalized pricing risks price discrimination with legal and reputational exposure, so segment/geo pricing is a deliberate guardrail.`,
          `C) Marketplaces are technically incapable of ever estimating an individual user's willingness-to-pay from behavioral data.`,
          `D) Personalized pricing violates the SUTVA assumption, which mechanically biases the elasticity estimate downward toward zero.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Surge is a market-clearing controller:** price is the actuator that rations scarce supply — raise it to suppress demand and attract supply until demand ≈ supply. Matching, not just extraction.`,
      `**Same mechanism everywhere:** rideshare surge, hotel rates rising with occupancy, airline fare buckets. All use price to clear a capacity-constrained market in real time.`,
      `**The price→demand→price loop can oscillate:** a closed loop with no damping whipsaws. Fix with smoothing (rate limits), hysteresis/deadbands (ignore noise), and caps that bound the actuator.`,
      `**Fairness/PR failure modes are load-bearing:** economically correct disaster surge is a reputational catastrophe → regulatory caps, emergency disablement, and explainability are required, not optional.`,
      `**Segment/geo pricing, not personalized:** pricing to an individual's WTP risks discrimination and legal exposure, so most systems vary price by area and time — a deliberate ethical guardrail.`,
    ],
    figures: {
      surge: `<svg viewBox="0 0 360 118" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="24" y="20" width="70" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="59" y="35" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">price ↑</text>
  <rect x="145" y="20" width="70" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="180" y="32" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">demand ↓</text>
  <text x="180" y="41" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">supply ↑</text>
  <rect x="266" y="20" width="76" height="24" rx="5" fill="none" stroke="var(--ink-mid)"/>
  <text x="304" y="35" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5" font-weight="700">gap closes</text>
  <path d="M94,32 L143,32" stroke="var(--ink-low)" stroke-width="1" marker-end="url(#a)"/>
  <path d="M215,32 L264,32" stroke="var(--ink-low)" stroke-width="1" marker-end="url(#a)"/>
  <path d="M304,44 Q304,72 180,72 Q59,72 59,46" fill="none" stroke="var(--amber,#d97706)" stroke-width="1" stroke-dasharray="3 3" marker-end="url(#a)"/>
  <text x="180" y="84" text-anchor="middle" fill="var(--amber,#d97706)" font-size="7.5">feedback loop — needs smoothing + caps or it oscillates</text>
  <text x="24" y="108" fill="var(--ink-low)" font-size="7.5">controller clears the market; disaster surge → add caps + explainability + geo (not personal)</text>
  <defs><marker id="a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
  },
  {
    id: 'causal_price_experiments',
    title: 'Causal Price Experiments: A/B, Geo & Switchback',
    subtitle: 'Why you almost never A/B test price at the user level, and how geo holdouts and switchback designs recover an unbiased elasticity',
    difficulty: 'advanced',
    estimatedMin: 28,
    tags: ['Pricing', 'experimentation', 'geo experiments', 'switchback'],
    summary: `You cannot read elasticity off observational data — so you experiment. But price is the one variable where the obvious experiment, randomizing the price *per user*, is usually the wrong design: it is often unfair or illegal, and even when allowed it **leaks and interferes**, quietly breaking the assumptions that make an A/B test valid.

[FIGURE: geoswitch]

---

**Per-user price randomization violates SUTVA and invites legal risk.** A clean A/B test assumes the Stable Unit Treatment Value Assumption: one user's treatment doesn't affect another's outcome. Prices break this because **users talk and compare** — showing person A \$9 and person B \$12 for the identical item means B can see A's price, feel cheated, and change behavior (churn, screenshot, complain). The treatment leaks across units. On top of the interference, charging different people different prices for the same good is a fairness and often a **legal** problem. So the per-user RCT is frequently off the table before the stats even matter.

---

**Geo experiments randomize the market, not the person.** Assign whole cities/regions to treatment (new price) or control (old price), then read the effect with **difference-in-differences** (compare the treated-vs-control change over the pre/post window) or **synthetic control** (build a weighted combination of control cities that tracks the treated city pre-period, then measure the divergence after). Everyone *in* a market sees the same price, so it's fair and consistent; randomization is at the market level, so there are usually few units — the key limitation is statistical power and needing good matched controls.

---

**Switchback designs randomize price over *time* — the fix for strong interference.** In a marketplace where supply and demand slosh across the whole system (rideshare, food delivery), even a geo split interferes: a price change in one zone spills into neighbors. Switchbacks turn the *entire market's* price on and off in short randomized time windows (e.g., 30-minute blocks alternating high/low) and compare outcomes across windows. Because the whole market is treated at once, cross-unit spillover within a window is absorbed rather than contaminating a control group. The catch is temporal autocorrelation (adjacent windows aren't independent) and carryover, which the analysis must account for. Whichever design you pick, the payoff is the same: an **unbiased %ΔQ / %ΔP** — the causal elasticity that observational data could never give you.`,
    interactivePrompt: `Before you touch the controls: you propose showing a random 50% of users a 10% higher price to measure elasticity. Name the two distinct reasons this design fails, and which alternative design fixes marketplace spillover specifically.`,
    keyPoints: [
      `**Per-user price randomization breaks SUTVA and courts legal risk.** Users compare prices, so one person's price affects another's behavior (interference/leakage) — and charging different people different prices for the same item is a fairness and often legal problem. The obvious A/B test is usually off the table.`,
      `**Geo experiments randomize markets, not people.** Assign whole cities to old vs new price; everyone in a market sees the same price (fair, consistent). Read the effect with difference-in-differences or synthetic control. The trade-off is few randomization units → limited power and a need for well-matched controls.`,
      `**Switchback designs randomize price over time to handle strong interference.** In marketplaces where supply/demand slosh system-wide, even geo splits spill over. Turning the whole market's price high/low in short randomized windows absorbs within-window spillover; the cost is temporal autocorrelation and carryover the analysis must model.`,
      `**All three designs exist to recover an unbiased %ΔQ / %ΔP.** The experiment is how you get the causal elasticity that observational data cannot: it forces price to vary for reasons unrelated to demand, breaking the endogeneity that biases naive regressions.`,
    ],
    takeaway: `You experiment on price because observational data is endogenous, but the naive per-user A/B test usually fails twice: it violates SUTVA (users compare prices, so treatments leak) and it is unfair/illegal to charge different people different prices for the same good. Geo experiments randomize whole markets (read via diff-in-diff or synthetic control) and switchback designs randomize the whole market's price over short time windows (the fix for system-wide marketplace spillover) — both trading power/complexity for an unbiased causal elasticity.`,
    checkQuestions: [
      {
        q: `Select the two correct reasons per-user price randomization is usually a poor design for measuring elasticity.`,
        options: [
          `A) It violates SUTVA, since users can compare prices, leaking one person's treatment into another's behavior.`,
          `B) Charging different people different prices for the identical good raises serious fairness and legal concerns.`,
          `C) It structurally has too few randomization units to ever reach statistical significance in practice.`,
          `D) It is the accepted industry-standard design already used successfully by every major rideshare marketplace.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `A rideshare company wants to test a fare change but worries that a change in one zone spills into neighboring zones. Which design best isolates the effect?`,
        options: [
          `A) A per-user A/B test, since randomizing at the individual level structurally removes all cross-zone spillover effects entirely and completely.`,
          `B) A switchback design: flip the whole market's price high/low in short randomized windows, absorbing spillover within each window.`,
          `C) A simple pre/post comparison in one city, which needs no control group since seasonal effects are assumed to be negligible.`,
          `D) A geo experiment is the only statistically valid design here; switchbacks structurally cannot measure any fare effects at all.`,
        ],
        answer: `B`,
      },
      {
        q: `In a geo price experiment, why is synthetic control often used to read out the effect rather than a raw treated-minus-control difference?`,
        options: [
          `A) Synthetic control eliminates the need for any randomization step entirely, since it constructs its own counterfactual city from scratch.`,
          `B) With few markets, no single control city matches well; synthetic control weights control cities to track the pre-period trend.`,
          `C) Synthetic control converts the geo experiment into a per-user test structure, which mechanically raises statistical power.`,
          `D) It removes temporal autocorrelation entirely, which is treated as the single dominant threat to validity in geo designs.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Per-user price randomization usually fails twice:** it breaks SUTVA (users compare prices → treatment leaks across users) and it is unfair/illegal to charge different people different prices for the same good. Off the table before the stats matter.`,
      `**Geo experiments randomize markets, not people:** whole cities get old vs new price (fair, consistent within a market). Read via difference-in-differences or synthetic control. Cost: few units → limited power, needs matched controls.`,
      `**Switchback designs randomize price over time:** flip the whole market high/low in short randomized windows; within-window system-wide spillover is absorbed rather than contaminating a control group. Cost: temporal autocorrelation and carryover to model.`,
      `**Choose by interference:** clean markets → geo; strong system-wide marketplace spillover → switchback. Per-user only in the rare fair/legal, no-comparison case.`,
      `**The payoff is a causal %ΔQ / %ΔP:** the experiment forces price to move independently of demand, breaking the endogeneity that biases observational elasticity.`,
    ],
    figures: {
      geoswitch: `<svg viewBox="0 0 360 128" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="14" y="16" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Geo: randomize markets</text>
  <rect x="14" y="24" width="30" height="22" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="48" y="24" width="30" height="22" rx="3" fill="none" stroke="var(--ink-mid)"/>
  <rect x="82" y="24" width="30" height="22" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="116" y="24" width="30" height="22" rx="3" fill="none" stroke="var(--ink-mid)"/>
  <text x="80" y="60" text-anchor="middle" fill="var(--ink-low)" font-size="7">treat / control cities → diff-in-diff or synthetic control</text>
  <text x="200" y="16" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Switchback: randomize time</text>
  <rect x="200" y="24" width="22" height="22" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="223" y="24" width="22" height="22" fill="none" stroke="var(--ink-mid)"/>
  <rect x="246" y="24" width="22" height="22" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="269" y="24" width="22" height="22" fill="none" stroke="var(--ink-mid)"/>
  <rect x="292" y="24" width="22" height="22" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="200" y="60" fill="var(--ink-low)" font-size="7">whole market flips high/low per 30-min window →</text>
  <text x="200" y="70" fill="var(--ink-low)" font-size="7">absorbs system-wide spillover</text>
  <line x1="14" y1="86" x2="346" y2="86" stroke="var(--ink-low)" stroke-width="0.6"/>
  <text x="14" y="102" fill="var(--ink-hi)" font-size="8" font-weight="700">Per-user A/B ✗</text>
  <text x="14" y="114" fill="var(--ink-low)" font-size="7.5">users compare prices → SUTVA broken + fairness/legal risk</text>
  <text x="14" y="126" fill="var(--prime)" font-size="7.5" font-weight="700">All three aim at one prize: unbiased %ΔQ / %ΔP</text>
</svg>`,
    },
  },
  {
    id: 'promotion_and_discount_uplift',
    title: 'Promotion & Discount Uplift',
    subtitle: 'Measuring the INCREMENTAL effect of a discount — separating true uplift from cannibalization, pull-forward, and buyers who would have bought anyway',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['Pricing', 'uplift modeling', 'incrementality', 'cannibalization'],
    summary: `Run a 20%-off promo, watch units sold jump 40%, and declare victory — that is how most promotions are "measured," and it is almost always wrong. The number that matters is not units sold at the discount, it is **incremental units caused by the discount**: the sales that would not have happened otherwise. Everything else is money handed to buyers who needed no persuasion.

[FIGURE: uplift]

---

**Uplift is a causal quantity: units *because of* the promo, not units *during* it.** Gross redemptions = baseline (would-have-bought) + incremental (persuaded). The whole discount is spent on both groups, but only the incremental group is a return. If 40% more units sold and 30 of those 40 points were people who'd have bought at full price, your real uplift is 10 points and you paid a discount on all of them. This is why naive promo ROI — (revenue during promo) ÷ (discount cost) — systematically overstates value.

---

**Three leakages inflate the naive number, and each needs a different correction.** (1) **Baseline sales** — buyers who would have purchased anyway; the discount is pure margin given away. (2) **Pull-forward** — you didn't create demand, you *borrowed it from next month*; sales spike then dip, and a window that ends at the spike books a phantom win. (3) **Cannibalization** — the discounted SKU steals sales from your own full-price products; category-level units are flat while you've traded margin for mix. Measuring only the promoted SKU over only the promo window hides all three.

---

**The fix is a control group plus uplift (heterogeneous-treatment-effect) modeling.** A holdout that *doesn't* see the promo gives the baseline directly: incremental = treated − control, over a window long enough to catch pull-forward payback and wide enough (whole category) to catch cannibalization. Then go further: an **uplift model** estimates each customer's *individual* treatment effect and sorts them into persuadables (buy only if discounted — the real target), sure things (buy anyway — discounting them is waste), lost causes (won't buy regardless), and sleeping dogs (the promo *reduces* their purchase). Targeting discounts only at persuadables is where uplift modeling pays for itself: same promo budget, far more incremental margin.`,
    interactivePrompt: `Before you touch the controls: a 20%-off promo shows units up 40% and you book it as a big win. Name the three leakages that could make the true incremental uplift far smaller, and the one measurement change that exposes all three.`,
    keyPoints: [
      `**Uplift is incremental units caused by the promo, not gross units at the discount.** Gross = baseline (would-have-bought) + incremental (persuaded). The discount is paid on both, but only the incremental group is a return. Naive ROI = revenue-during ÷ discount-cost systematically overstates value.`,
      `**Three leakages inflate the naive number.** Baseline sales (buyers who'd have purchased anyway — pure margin given away), pull-forward (demand borrowed from next month; sales spike then dip), and cannibalization (the promoted SKU steals from your own full-price SKUs). Measuring one SKU over the promo window alone hides all three.`,
      `**A control group is the fix for baseline; window/scope are the fix for pull-forward and cannibalization.** A holdout that doesn't see the promo gives incremental = treated − control. Extend the window past the payback dip to catch pull-forward, and measure the whole category (not just the promoted SKU) to catch cannibalization.`,
      `**Uplift modeling targets only persuadables.** A heterogeneous-treatment-effect model sorts customers into persuadables (buy only if discounted — the target), sure things (waste), lost causes (won't buy), and sleeping dogs (promo backfires). Discounting only persuadables converts the same budget into far more incremental margin.`,
    ],
    takeaway: `A promotion's value is incremental units caused by the discount, not units sold at the discount — and the naive "units jumped 40%" number is inflated by baseline buyers (would have bought anyway), pull-forward (demand borrowed from the future), and cannibalization (stealing from your own full-price SKUs). A no-promo control group over a long-enough, category-wide window measures true uplift = treated − control, and uplift/HTE modeling goes further by discounting only the persuadable customers instead of the sure things.`,
    checkQuestions: [
      {
        q: `A 20%-off promo raises units sold by 40%. Select the two leakages that could make true incremental uplift far smaller than 40%.`,
        options: [
          `A) Baseline sales — buyers who would have purchased at full price anyway.`,
          `B) Pull-forward — demand borrowed from next month's sales rather than newly created.`,
          `C) Elasticity threshold effects — 40% sits just below the unit-elastic cutoff of |ε| = 1.`,
          `D) Measurement lag — POS systems undercount promotional transactions by design.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `After a promo ends, sales drop below their normal level for several weeks. What is this, and how should it change measurement?`,
        options: [
          `A) Cannibalization — the promo permanently reduced category demand going forward, so no change to measurement window is needed.`,
          `B) Pull-forward — demand was borrowed from the future, so the window must extend past the dip or you'll book a phantom win.`,
          `C) A seasonal artifact entirely unrelated to the promo's timing, so the post-promo sales dip should simply be ignored.`,
          `D) Baseline drift — recalibrating the baseline model to the new post-promo average makes the dip disappear from the data.`,
        ],
        answer: `B`,
      },
      {
        q: `An uplift (HTE) model classifies a segment of customers as "sure things." What is the correct action, and why?`,
        options: [
          `A) Target them heavily with discounts, since sure things have the highest historical conversion rate of any customer segment observed.`,
          `B) Do NOT discount them — they buy at full price regardless, so the discount is pure margin given away with zero incremental effect.`,
          `C) Discount them modestly, hedging against classification error since the model's segment boundaries are only ever probabilistic.`,
          `D) Exclude them entirely from all future campaigns, including full-price offers and general marketing communications.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Uplift = incremental units caused by the promo,** not gross units at the discount. Gross = baseline + incremental; the discount is paid on both but only incremental is a return. Naive ROI overstates value.`,
      `**Three leakages inflate the naive number:** baseline (would-have-bought — free margin given away), pull-forward (demand borrowed from the future; spike then dip), and cannibalization (stealing from your own full-price SKUs).`,
      `**A no-promo control gives the baseline:** incremental = treated − control. Extend the window past the payback dip (pull-forward) and measure the whole category (cannibalization), not one SKU over the promo window.`,
      `**Uplift/HTE modeling sorts customers:** persuadables (buy only if discounted — the target), sure things (waste), lost causes (won't buy), sleeping dogs (promo backfires).`,
      `**Target only persuadables:** same discount budget, far more incremental margin. Discounting sure things is pure margin donation.`,
    ],
    figures: {
      uplift: `<svg viewBox="0 0 360 124" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="14" y="14" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Gross redemptions during promo</text>
  <rect x="14" y="22" width="200" height="20" fill="var(--ink-mid)" opacity="0.35"/>
  <rect x="14" y="22" width="150" height="20" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="90" y="36" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">baseline (would-have-bought)</text>
  <text x="270" y="36" fill="var(--prime)" font-size="7.5" font-weight="700">incremental ← the only return</text>
  <text x="14" y="60" fill="var(--ink-low)" font-size="7.5">leakages that shrink true uplift:</text>
  <text x="24" y="74" fill="var(--ink-mid)" font-size="7.5">• baseline — discount given to buyers who'd have bought</text>
  <text x="24" y="86" fill="var(--ink-mid)" font-size="7.5">• pull-forward — demand borrowed from next month (spike then dip)</text>
  <text x="24" y="98" fill="var(--ink-mid)" font-size="7.5">• cannibalization — steals from your own full-price SKUs</text>
  <text x="14" y="116" fill="var(--prime)" font-size="7.5" font-weight="700">uplift = treated − control · target persuadables, not sure things</text>
</svg>`,
    },
  },
  {
    id: 'willingness_to_pay_and_competition',
    title: 'Willingness-to-Pay & Competitive Modeling',
    subtitle: 'Estimating the price a segment will bear, and pricing in a market where competitors respond to your moves',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['Pricing', 'willingness-to-pay', 'competitive response', 'segmentation'],
    summary: `Elasticity tells you how a *market* reacts to price. Two harder questions decide real pricing: how much will *this segment* pay (their **willingness-to-pay**), and what happens when a **competitor re-prices** in response to your move? Ignore the first and you leave money on the table; ignore the second and your carefully optimized price triggers a war that erases the gain.

[FIGURE: wtp]

---

**Willingness-to-pay is the reservation price — and you estimate it three ways.** WTP is the most a buyer will pay before walking away; a segment's demand curve is the distribution of WTPs. You estimate it by: **stated preference** — surveys like Van Westendorp ("at what price is this too expensive / a bargain?"), cheap but biased by what people *say* vs *do*; **choice modeling / conjoint** — show realistic bundles and infer the price coefficient from actual choices, more robust; and **revealed preference** — the gold standard, reading WTP from real behavior in a price experiment (they *paid*, so it's real). Segment-level WTP curves are what enable **differential pricing** — student vs enterprise tiers, geographic pricing — capturing more of each segment's surplus than one flat price can.

---

**The second-order trap: your optimum assumes competitors stand still.** A naive price optimizer maximizes profit against *today's* competitor prices — a one-shot best response. But competitors have their own optimizers. Cut price to win share and a rival matches you; now both of you sell at the lower price with the *same* share split — you've moved to a worse equilibrium for both. The correct object isn't a one-shot optimum, it's a **reaction function**: my best price *given how you'll respond*, solved to a **competitive (Nash) equilibrium** where neither side wants to deviate.

---

**Which is why price wars are a strategic failure, not a modeling win.** A local optimizer that ignores reactions will happily walk both firms down to marginal cost — every step looks locally profitable, the destination is ruinous. Real competitive pricing weighs the **reputational and equilibrium cost** of a move: matching a rival's cut may be rational defense, *initiating* one rarely is. The senior instinct is to model the competitor as a *player*, not a fixed constant — ask "and then what do they do?" before shipping the price. The math that maximizes profit against a frozen competitor is precisely the math that starts the war.`,
    interactivePrompt: `Before you touch the controls: your optimizer says cut price 10% to grab share, and it's locally profit-improving. What does it assume about the competitor, and what actually happens to both firms' profits once that assumption fails?`,
    keyPoints: [
      `**WTP is the reservation price; a segment's demand curve is the distribution of WTPs.** Estimate it via stated preference (Van Westendorp surveys — cheap, biased by say-vs-do), choice modeling/conjoint (infer the price coefficient from realistic choices — more robust), and revealed preference (read WTP from a real price experiment — the gold standard).`,
      `**Segment-level WTP enables differential pricing.** Student vs enterprise tiers and geographic pricing capture more of each segment's surplus than a single flat price. The finer and more credible your WTP estimates, the more surplus you convert — bounded by fairness and legal limits on discrimination.`,
      `**A one-shot optimum assumes competitors stand still — they don't.** Maximizing profit against today's competitor prices is a best response to a frozen opponent. Real competitors re-price, so the correct object is a reaction function solved to a competitive (Nash) equilibrium where neither side wants to deviate.`,
      `**Price wars are a strategic failure a local optimizer walks you into.** Every step of "cut to win share" looks locally profitable while a matching rival drives both firms toward marginal cost. Matching a rival's cut can be rational defense; initiating one rarely is. Model the competitor as a player, not a constant.`,
    ],
    takeaway: `Willingness-to-pay is a segment's reservation price — estimated by stated preference (surveys), choice/conjoint modeling, or revealed preference from experiments — and segment-level WTP curves are what let differential pricing capture more surplus than a flat price. But a profit optimizer that treats competitor prices as fixed computes a one-shot best response that ignores retaliation; the correct object is a reaction function solved to a competitive equilibrium, because the same math that maximizes profit against a frozen competitor is what starts a price war down to marginal cost.`,
    checkQuestions: [
      {
        q: `Which method of estimating willingness-to-pay is most credible, and why?`,
        options: [
          `A) The Van Westendorp survey — asking customers directly is the single most accurate way to learn their true willingness-to-pay.`,
          `B) Revealed preference from a real price experiment: buyers actually paid at tested prices, avoiding the say-vs-do bias of surveys.`,
          `C) Whichever method happens to be cheapest to run, since all willingness-to-pay estimation methods are equally reliable in practice.`,
          `D) Conjoint analysis, because unlike surveys and experiments it requires no data collection from actual customers whatsoever.`,
        ],
        answer: `B`,
      },
      {
        q: `Select the two correct statements about a price optimizer that ignores competitor response.`,
        options: [
          `A) It implicitly assumes competitors will hold their prices fixed at today's exact level indefinitely.`,
          `B) In reality a rival often matches the cut, leaving both firms at a lower price with roughly the same share split.`,
          `C) The correct fix is always to ignore competitor behavior entirely and simply re-run the optimizer more frequently.`,
          `D) This flawed assumption only ever matters in monopoly markets that have a single dominant firm.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `When is matching a competitor's price cut a defensible move, versus initiating one?`,
        options: [
          `A) Initiating a cut is always strategically superior, since first movers permanently capture share before competitors can react at all, in any market.`,
          `B) Matching can be rational defense against ceding share, while initiating usually triggers retaliation that walks both firms toward cost.`,
          `C) Both are equally good strategic choices, since competitive response never meaningfully affects the eventual profit outcome.`,
          `D) Neither — any price change whatsoever in a competitive market is fundamentally irrational and should never be attempted.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**WTP is the reservation price;** a segment's demand curve is the distribution of WTPs across its buyers.`,
      `**Estimate WTP three ways:** stated preference (Van Westendorp surveys — cheap, say-vs-do biased), choice/conjoint (infer the price coefficient from realistic choices — robust), revealed preference (read WTP from a real price experiment — gold standard).`,
      `**Segment-level WTP → differential pricing:** student/enterprise tiers, geographic pricing capture more surplus than one flat price, bounded by fairness/legal limits.`,
      `**A one-shot optimum assumes competitors stand still — they don't:** the correct object is a reaction function solved to a competitive (Nash) equilibrium where neither side wants to deviate.`,
      `**Price wars are a strategic failure a local optimizer walks you into:** every "cut to win share" step looks locally profitable while a matching rival drives both to marginal cost. Match in defense; rarely initiate. Model the competitor as a player, not a constant.`,
    ],
    figures: {
      wtp: `<svg viewBox="0 0 360 124" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="14" y="14" fill="var(--ink-hi)" font-size="8.5" font-weight="700">WTP distribution → segment demand</text>
  <line x1="20" y1="66" x2="180" y2="66" stroke="var(--ink-low)" stroke-width="1"/>
  <path d="M20,64 C60,20 90,24 110,44 C130,64 160,64 180,64" fill="var(--prime-faint)" stroke="var(--prime)" stroke-width="1.5"/>
  <line x1="70" y1="24" x2="70" y2="66" stroke="var(--amber,#d97706)" stroke-width="1" stroke-dasharray="2 2"/>
  <text x="70" y="80" text-anchor="middle" fill="var(--ink-low)" font-size="7">reservation price</text>
  <text x="20" y="96" fill="var(--ink-mid)" font-size="7">surveys · conjoint · revealed preference (gold)</text>
  <line x1="200" y1="18" x2="200" y2="100" stroke="var(--ink-low)" stroke-width="0.6"/>
  <text x="214" y="14" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Competitor responds</text>
  <text x="214" y="30" fill="var(--ink-mid)" font-size="7.5">you cut →</text>
  <text x="214" y="42" fill="var(--ink-mid)" font-size="7.5">rival matches →</text>
  <text x="214" y="54" fill="var(--amber,#d97706)" font-size="7.5" font-weight="700">same share, lower price (both worse)</text>
  <text x="214" y="72" fill="var(--ink-low)" font-size="7">one-shot optimum ✗ · reaction function → Nash eq.</text>
  <text x="214" y="90" fill="var(--prime)" font-size="7.5" font-weight="700">ask: "and then what do they do?"</text>
  <text x="14" y="118" fill="var(--ink-low)" font-size="7.5">the math that maxes profit vs a frozen rival is what starts the price war</text>
</svg>`,
    },
  },
]
