# MSL — Exposure Map + First LinkedIn Batch

Logged 2026-06-19. Tactical execution document derived from the shared cross-lab operating decision (see also `docs/STRATEGY.md` for the broader strategic argument).

Shared thesis across PAL, MSL, GAL/GSL: most interview prep trains recall; real interviews test judgment. MSL specifically = production ML judgment beyond model trivia. The labs are content engines for LinkedIn first; product backlinks wait until the linked surface is genuinely ready.

Rule: content can go public before the product is perfect. Backlinks only when the linked path is ready.

---

## 1. GREEN surfaces — safe to link publicly

Criteria: tested manually, clear within 30 seconds, stable UX, useful to a stranger, has a clear next step.

- **The MLE Path landing view** (`?path=foundations#gradient`) — 11 tiers visible, progress UI, clear next step on every tier. Survives the 30-second stranger test.
- **Individual path posts that were authored or audited recently** with production tells, Simplify toggle, prereq/successor strip, interview Qs:
  - Post 1 Training-Serving Skew
  - Post 3 AUC Is Not Your Friend
  - Post 20 Validation Set Lying
  - Post 73 XGBoost
  - Post 74 Bias-Variance
  - Post 76 Calibration
  - Post 121 CUPED
  - Post 127 Ensemble Methods
  - Posts 128–132 (Observation Discipline, Class Imbalance, Leakage Taxonomy, Error Analysis, Explainability)
- **Gradient post deep links by slug** (`?post=<slug>#gradient`) — every post has a stable URL, mobile-readable.
- **MLE Path Tier 7–10 absorbed posts** (1, 7, 38, 41, 43, 5, 23, 39, 40, 46, 24, 4, 72, 71, 80, 8, 13, 18) — production-engineering and system-design content, mostly featured-quality.

## 2. YELLOW surfaces — LinkedIn content only, no product link yet

- **Practice tabs** — IncidentRoomTab, MLCodingTab, SpotTheFlawTab, Combinator, Trainer, Defense Plan, Project Labs (Telco Churn / Loan Default / Fraud Detection). Source for screenshots and case prompts; require sign-in or context a stranger doesn't have.
- **CheatsheetTab** — 50 flashcards, 12 formulas, trade-off cards. Excellent carousel content and downloadable PDF material. No clear "next step" from inside it.
- **Quiz Me sections** inside posts — engagement-test screenshots.
- **GradientVisuals** (BiasVariancePlot, NDCGVisual, AttentionHeatmap, L1L2Geometry, PRThresholdSlider, etc.) — diagram material for carousels; inline placement requires the post context.
- **The 11-tier ladder visualization** — great screenshot for "this is the curriculum" posts without forcing a click.

## 3. RED surfaces — do not expose yet

- **Deferred posts** (KNN, Naive Bayes, Manifold) — render as muted "· deferred"; awkward for a stranger.
- **Study Room** (Shift+Ctrl+K) — auth-gated, Anki seeding pending.
- **Plans & Access tab** — ₹ pricing exists but not pressure-tested with paying customers; AccessGate flows untested by real strangers.
- **AskTab** — Web Speech API surface, untested as a public entry.
- **LandscapeTab** — opinionated tooling map, weird for a first-time stranger.
- **InterviewExperiences entry** — blocked on Formspree + Tally credentials.
- **ResourcesTab** — trainer prompt page, untested as a public landing.
- **SignedOutHome auth gate flow** — if a stranger hits a premium tab and gets the auth modal, the flow hasn't been polished.

## 4. First public CTA

**"Try The MLE Path — 57 posts, 11 tiers, free, no signup."**

Lands on the ladder view. Survives 30 seconds. Has a visible next step (open any tier, read a post).

## 5. Where 500 LinkedIn visitors should land

**The MLE Path ladder view** (`?path=foundations#gradient`), not a single post.

The ladder is the unique product — 57 posts across 11 tiers is the visual that nothing else in the space has. A single post lands a stranger inside content they may or may not need; the ladder shows the whole curriculum and lets them self-select.

## 6. Top 5 fixes before more public backlinks are safe

1. **Open Graph card** for `?path=foundations#gradient`. The link preview on LinkedIn is the gatekeeper between impressions and clicks. Without a polished OG card, the link preview is generic or broken. This single fix 3–5x the CTR on every backlink post forever.
2. **One-line stranger clarity strip** at the top of the path landing. Currently assumes you know what MSL is. Add: "Free first-principles curriculum for senior MLE interviews — 57 posts, 11 tiers, no signup required."
3. **Mobile typography pass** on path posts. Indian engineers read on phones; current is mobile-readable but not mobile-optimized.
4. **First-time visitor banner on the ladder** that disappears after first read — explains the Simplify toggle, ToC dropdown, glossary hover-cards in two sentences.
5. **Verify the public tier opens without an auth wall** — if a stranger hits a premium-tab boundary in the first 30 seconds, they bounce.

## 7. Fifteen LinkedIn post ideas

### Judgment Challenges (5) — drive comments

1. "Offline AUC went from 0.89 to 0.92. The same model in production loses 8% of revenue per week. Your three diagnostic hypotheses, in order?"
2. "Your fraud model says 0.94 probability fraud. The reviewer blocks. The customer was real, lost their job over the block. What do you fix — model, threshold, calibration, or process?"
3. "A junior teammate fits StandardScaler on the full dataset before splitting. Test AUC is 0.94. You re-fit inside the CV fold and it drops to 0.81. Do you ship the 0.94 version?"
4. "PSI > 0.2 fires on a critical feature at 2am. The on-call engineer retrains the model. Two days later business metrics are still down. What's happening?"
5. "Your model's offline calibration error is 1.2%. In production, decisions made on 0.9 predictions are wrong 30% of the time. The on-call says 'recalibrate.' Is recalibration the right fix?"

### India Insider (5) — the unique wedge

6. "What PhonePe asks senior MLE candidates that FAANG doesn't — and why most US-prep candidates fail it."
7. "The Razorpay senior MLE loop has 4 rounds. Round 3 is the round most candidates lose. Here's why."
8. "Flipkart vs Amazon India MLE interviews — same role, completely different rubric."
9. "Swiggy's ML system design round expects a specific structure most candidates don't know. The framework."
10. "Why Indian unicorn senior MLE interviews increasingly weight production judgment over LeetCode — and what that means for your prep this quarter."

### Expert Debriefs (5) — depth signal

11. "Three production tells of training-serving skew that every senior MLE recognizes — and the one most teams miss until business metrics break."
12. "Why high AUC + low calibration is the most common 'good model that fails in production' pattern. The diagnostic sequence."
13. "Bias-variance isn't just about train/test gap. Four production tells that distinguish bias problems from variance problems."
14. "Why precision@K matters more than AUC for any fraud, churn, or default model — with the math senior interviewers expect."
15. "The eleven types of data leakage. Most candidates know three. Senior interviewers test the other eight."

## 8. Three posts that should include a product link

- **Post 12** (Production tells of training-serving skew) → link to **Post 1** in The MLE Path (`?post=training-serving-skew#gradient`). Recently audited, has production tells, lands clean.
- **Post 13** (High AUC + low calibration) → link to **Post 76 Calibration** or the MLE Path Tier 3 entry. Post 76 was audited v4.106; lands clean.
- **Post 15** (Eleven types of data leakage) → link to **Post 130 Data Leakage Taxonomy** (the post written for this curriculum). The link is the proof.

## 9. Three posts that avoid links — authority only

- **Post 1** (Judgment challenge: offline AUC vs production revenue) — pure engagement, drives comments. The value is the question, not the product.
- **Post 8** (Why Indian unicorn senior MLE interviews weight production judgment over LeetCode) — founder opinion + authority play. No product link, just the take.
- **Post 11** (Expert debrief of last week's challenge) — the second-shot post that creates the weekly rhythm. The analysis is the value.

## 10. The one thing to ship next to be backlink-ready

**An Open Graph card / link preview image for `?path=foundations#gradient`.**

When an MSL URL pastes into LinkedIn, the preview is currently generic (or broken). Every link click depends on the preview card landing. A polished OG image showing "The MLE Path · 57 posts · 11 tiers · Free" with the amber gradient identity will 3–5x the CTR from LinkedIn on every backlink post.

One-evening build: design the image in Figma/Canva, add the `<meta property="og:image">` tag in `index.html`, push. Affects every LinkedIn link from this point forward.

---

## Notes for execution

- The 15 post ideas are seeds, not full drafts. The Judgment Challenges are ~80 words each. The India Insider posts are ~150–200 words. The Expert Debriefs are ~200–300 words. All should default to carousel format for technical content, text for opinion.
- Cadence: 5–7 posts/week on the MSL side if MSL is the primary lab; 2–3/week if PAL is the primary spearhead (per cross-lab decision).
- Post as Avinash, not as MSL. Personal brand drives the lab brand, not the other way around.
- Spend 30 minutes/day commenting on other people's posts in the data/ML/AI space. That's where 40–60% of follower growth comes from in the first six months.
- The "post the challenge Monday, debrief Wednesday" rhythm is the engagement loop. Tag thoughtful commenters in the debrief.
