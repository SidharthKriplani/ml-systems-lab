# FEEDBACK_LOG.md — MSL feedback aggregation

Created 2026-06-19. Working doc, not a spine file. Log feedback summaries here from all sources so patterns can be spotted across the noise.

---

## How to use this file

- **Sources** — note where each piece came from (FeedbackChip / LinkedIn DM / WhatsApp / in-person / interview report / Twitter / email). Always date-stamp.
- **Themes** — when you see the same comment from 3+ sources, promote it to a named theme. Themes drive the build queue.
- **Verbatim quotes** — keep raw quotes, attributed where allowed. They are gold for LinkedIn content and for product copy.
- **Actions taken** — once a theme drove a change, log the version it shipped in. This closes the loop and proves to future you that feedback got heard.
- **Open / triage** — anything received but not yet acted on or dismissed. Empty most of the time is healthy.

Update this file whenever a meaningful batch of feedback arrives. Don't log every "looks great" — log signal.

---

## Themes (recurring patterns)

### Onboarding overwhelm for new users (cross-lab)
- Sources: PAL beta tester / beginner POV (1) — applies directly to MSL given near-identical Home structure
- First noted: 2026-06-19
- Status: ⚠️ Open · 2 of 7 actions gating LinkedIn launch
- Symptom: A beginner lands on Home and cannot find a single starting point. Too many parallel recommendations (guided paths, learning paths, study plans, Recently Added, callouts, track grid, heatmap, sidebar, bottom nav). Jargon on nav labels assumes domain familiarity ("Combinator," "Stafflayer," "Defense Plan," "Incident Room"). Result: "Where do I actually start?" → bounce.
- Why this matters for MSL specifically: MSL's Home has even more surfaces than PAL's. If the LinkedIn campaign drives 500 visitors to a cold beginner and they hit the current Home, they bounce. Gating issue for launch readiness, not a polish item.
- Proposed actions (full list in chat 2026-06-19, ranked by leverage):
  1. ⚠️ Open · 3-question onboarding quiz on first visit → outputs ONE specific starting recommendation. Skippable for power users.
  2. ⚠️ Open · Cold Home when `totalAttempted === 0` — hide Recently Added, Continue, callouts, track grid, heatmap, bookmarks. Show only: greeting + onboarding result + single big "Start: [Post] →" CTA.
  3. ⚠️ Open · Progressive surfacing — Home modules appear as user crosses behaviour thresholds (1 post → path tile, 3 → Recently Added, 5 → track grid, 1 tier → guided paths). Brief one-time "you unlocked X" toast.
  4. ⚠️ Open · Tooltips on every opaque nav label using the existing GlossaryTerm component pattern. Hover/tap → one-sentence "what this is, when to use it."
  5. ⚠️ Open · "Interview readiness %" headline metric on Home and ProfilePage. Aggregate of path progress + practice scores + recent activity. Updates with milestones.
  6. ⚠️ Open · Time estimates on every tier and guided path ("Tier 5 · ~3-4 hours · 7 posts").
  7. ⚠️ Open · Empty-state polish on every tab — first time a user lands in MLCoding / IncidentRoom / SystemDesign, show a "start here: pick this one first" prompt instead of the full grid.
- Decision (2026-06-19): Build items 1 + 2 next session (gating LinkedIn launch). Items 3-7 defer until real beginner behaviour surfaces from actual visitors after launch.

---

## Verbatim quotes

### 2026-06-19 — PAL beta tester, beginner POV (forwarded to MSL as cross-lab applicability)
"The home screen felt a bit overwhelming because I was seeing 222 items, so many rooms, guided paths, study plans, readiness charts, SQL progress, learning paths etc etc etc. Instead of immediately knowing what to do, mera first thought tha ki where do I actually start? I think it would be better if the first experience was a lot simpler and the rest of the features gradually unlocked as users made progress.

Also, the platform assumes beginners already know terms like RCA, Instrumentation vagera. A small one-line explanation or why this matters tooltip would make things much less intimidating. Another thing was that there were multiple recommendations at once like Start Metrics, Beginner Path, Guided Paths, Study Plan and Learning Paths, so it became a little confusing. Ab mai toh samajh pa raha hu. But as a beginner I'd rather have one clear recommendation saying this is where you should begin.

The progress system is nice, but it could feel more motivating with milestones like complete your first 5 cases, you're 15% interview ready, or an estimated completion time for a track."

→ Theme: Onboarding overwhelm for new users (cross-lab)

---

## Actions taken

*Empty. Add when feedback drove a shipped change, with version reference.*

<!-- Example template:
### v4.X — Theme: [name] → Action: [what changed]
- Sources cited: N
- Triggered: YYYY-MM-DD
- Shipped: YYYY-MM-DD
- Commit: vX.YZ
-->

---

## Open / triage

*Empty. Add feedback received but not yet acted on or dismissed.*

<!-- Example template:
### YYYY-MM-DD — [Source] — [Brief description]
What was said:
Why it's not yet actioned:
Next review date:
-->

---

## Sources to monitor

When feedback channels go live, list them here so they get checked on a regular cadence.

- **FeedbackChip** — Formspree submissions (currently blocked on Formspree ID).
- **WhatsApp beta group** — `https://chat.whatsapp.com/KqFoGxAW0XMF9hNllGyAo9`
- **Founder DM** — `https://wa.me/917838438784`
- **LinkedIn DMs** — when the LinkedIn campaign launches (see `docs/MSL_EXPOSURE_PLAN.md`).
- **Interview Experiences form** — Tally (currently blocked on Tally ID).
- **Direct email** — Avinash's inbox.
- **In-person / cohort sessions** — once they start.

---

## Why this file exists

Feedback is the only ground truth about whether MSL works in the wild. Internal taste says the MLE Path is excellent. The wild may disagree, and when it does, the disagreement is the most valuable signal in the project. This file is the place that signal lives so it doesn't evaporate into a thousand WhatsApp messages.

Three rules:

1. **Don't filter.** Log harsh feedback verbatim. The instinct to soften it is the same instinct that ships the wrong product.
2. **Promote themes, not opinions.** One person saying "make it dark mode" is noise. Three people saying it from different sources is a theme.
3. **Close the loop.** When feedback drives a change, log the version in Actions taken. Future you needs to know the system works.
