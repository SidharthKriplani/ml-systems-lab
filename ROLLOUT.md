# ROLLOUT.md — Beta Rollout Operations

Operational only. Not a backlog. Not a feature list.  
This file tracks what goes out, in what order, to whom, and what gets checked before it does.  
Read before opening any batch to testers.

---

## Principles

1. Batch 0 is founder-only. No exceptions.
Every batch starts with the founder using the product as a stranger would — cold, no context, no knowledge of what's behind the UI. Obvious breakage gets caught here so testers spend time on judgment calls, not bug reports.

2. Every batch entry has two layers: profile and scope.
Profile = who the tester is and what they are trying to do. Scope = what they are testing. Both are required. "Batch 1 = these 5 features" is not a batch entry. A specific person with a specific goal testing a specific thing is.

3. Tester brief is one specific prompt, not a list.
Vague prompts produce vague feedback. Each batch gets one concrete scenario the tester walks through. If you need to test two distinct things, run two batches.

4. Feedback has an expiry date.
Tester feedback on Batch N is only valid until Batch N+1 ships. When the next batch opens, mark the previous batch's feedback field as closed. Do not let unresolved notes from old batches accumulate as if they are still actionable.

5. Mobile is non-negotiable in every vet checklist.
Every batch — Batch 0 included — must be tested on a real mobile device before testers see it. Not browser devtools. A real phone. Every batch entry has a mobile vet row in the checklist.

6. Pass must be defined before the batch opens.
Each batch entry states what pass looks like before a single tester is invited. If you cannot define pass, the batch is not ready to open.

---

## Batch 0 — Founder Self-Vet

**Status:** Open  
**Opened:** —  
**Closed:** —

**User profile:** Founder, using the product as a first-time visitor with no prior context. Navigate as a stranger would — no knowledge of what's behind any tab or zone.

**Scope:** Full product surface. Every zone, every nav path, every interactive element that will be live when Batch 1 opens.

### Self-vet checklist

| Area | Check | Mobile | Status |
|------|-------|--------|--------|
| **Onboarding / first impression** | Land on HomeTab cold — is it immediately clear what this is and what to do? | ✓ required | — |
| **Practice zone core loop** | Pick a domain → open a module → answer scenarios → score updates in localStorage | ✓ required | — |
| **CombinatorTab (timed mock)** | Start a 30-min session → answer questions → end early → debrief renders correctly | ✓ required | — |
| **TrainerTab (MCQ drill)** | Complete a session → weakness heatmap renders → history saves | ✓ required | — |
| **JDPrepTab** | Paste a real JD → skill extraction runs → Must/Important/Good to Have ranks appear → nav links work | ✓ required | — |
| **DefenseDocTab** | Generate a defense brief → checklist mode → print/PDF export (test on Chrome + Safari) | ✓ required | — |
| **VerbatimTab** | Open on Android Chrome → record → transcript appears → self-rating saves. Open on iOS → fallback message shown, no broken UI | ✓ required | — |
| **GradientTab (Read zone)** | Browse posts → filter by domain → open a post → CTA link navigates to correct practice module | ✓ required | — |
| **Global search** | Search a term → results appear → click result → navigates correctly | ✓ required | — |
| **Bottom nav** | All 5 zones accessible → active zone resets to grid on re-tap → breadcrumb back button works | ✓ required | — |
| **localStorage persistence** | Complete 2 modules → close tab → reopen → scores are intact | ✓ required | — |
| **v4.8 mobile fixes** | Input tap on iOS does not zoom page · SVG diagrams scroll horizontally · MLOpsDeployTab table scrolls · Back button easy to tap | ✓ required | — |
| **No horizontal overflow** | Scroll every tab — nothing bleeds past the right edge | ✓ required | — |
| **Low brightness readability** | Drop phone brightness to ~20% — all text still readable, no invisible elements | ✓ required | — |

**Pass criteria:** Every checklist row green on both desktop and real mobile. No broken nav paths. No invisible content at low brightness. Print export produces readable output on at least Chrome.

**Feedback collected:** N/A — founder self-vet only.

---

## Batch 1 — First External Testers

**Status:** Pending (opens after Batch 0 passes)  
**Opened:** —  
**Closed:** —

**User profile:** ML engineer or data scientist actively prepping for interviews, 2–4 weeks out from an interview. Uses the product on mobile during commute or on laptop at home. Has no prior knowledge of the tool — arrives via a direct link, no walkthrough given.

**Scope:** The three most polished, self-explanatory features:
1. **CombinatorTab** — timed mock exam (30-min session, full debrief)
2. **TrainerTab** — MCQ drill with weakness heatmap
3. **JDPrepTab** — paste JD → ranked skill extraction → nav to modules

These three cover the core "practice and study" loop without requiring testers to understand the full Interview zone simulation layer.

### Self-vet checklist (before opening Batch 1)

| Check | Mobile | Status |
|-------|--------|--------|
| Batch 0 fully passed | ✓ required | — |
| CombinatorTab tested with 3 different real ML JDs as context (not just one) | ✓ required | — |
| TrainerTab history renders correctly after 2+ sessions | ✓ required | — |
| JDPrepTab tested with 3 different real JDs — sparse, dense, and ambiguous | ✓ required | — |
| All three features work end-to-end on real iOS and Android | ✓ required | — |
| Tester brief written and reviewed — one prompt, no instructions | — | — |

**Tester brief (send verbatim):**

> You're 3 weeks out from an ML engineering interview. Paste your actual JD (or a real one you've seen) into the tool at [URL], then run one practice session using whatever the tool surfaces. That's it. Don't read any instructions — just use it. After 20 minutes, tell me: where did you drop off, what felt useful, and did anything feel like it was made for someone else's interview and not yours?

**Feedback target:** Not "does it work." Specifically: did the JD-to-study-plan flow feel personal to them, or generic? Did they complete the Combinator session or abandon it and why? Was the timed pressure useful or annoying?

**Pass criteria:** At minimum — 3 of 5 testers complete the Combinator session without asking for guidance. At least one piece of specific, actionable feedback per tester (not "looks good"). No tester reports a broken flow.

**Feedback collected:** Open — fill in below as responses arrive. Close when Batch 2 opens.

| Tester | Profile | Completed core flow? | Key feedback | Actionable? |
|--------|---------|---------------------|--------------|-------------|
| — | — | — | — | — |

---

## Batch 2 — Interview Zone Depth (stub)

**Status:** Not open. Fill in properly after Batch 1 closes.

Profile will likely be: same cohort as Batch 1 but specifically people who are within 1 week of an interview — time pressure is real. Scope will expand to the full Interview zone: VerbatimTab, DefenseDocTab, and the JDPrepTab → DefenseDocTab → Combinator → Verbal simulation sequence. The question being tested shifts from "does this feel personal" to "does this feel like a coherent prep system."

---

## Batch 3 — Breadth (stub)

**Status:** Not open. Fill in properly after Batch 2 closes.

Profile will likely be: ML engineers not currently interviewing — using the tool for ongoing skill maintenance or to identify gaps. Scope shifts to the Practice zone modules, learning paths, and GradientTab. The question being tested: does the product have a reason to come back to after the interview is over?

---

## Feedback archive

*Move closed batch feedback here when the next batch opens. Do not delete — it is historical signal.*

— nothing archived yet —
