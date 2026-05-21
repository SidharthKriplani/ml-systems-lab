# AUDITS.md — Health Log

Diagnostic, not prescriptive. Every audit run is logged here with findings, resolved status, and date.  
Resolved findings that become buildable features go into **IDEAS.md**. Findings that reveal a missing architectural rule go into **DECISIONS.md**.

---

## Audit type reference

| Type | What it covers | Suggested frequency |
|------|---------------|-------------------|
| **BUILD** | Prop wiring, dead code, duplicate keys, component contracts, brace balance | After any large refactor |
| **Visual Consistency** | Color drift, spacing, border radius, font usage, CSS variable adherence | Monthly |
| **Navigation & Discoverability** | Hidden features, dead-end flows, tab/menu structure, breadcrumb accuracy | After adding new tabs/zones |
| **Content Integrity** | Stale copy, question bank counts vs targets, duplicate localStorage keys, version mismatches | Before interview prep seasons |
| **Framework / Technical** | Hook usage, render correctness, React patterns, Pyodide integration | After React upgrades |
| **UX / Human Elements** | Empty states, tone, onboarding friction, first-load experience, mobile feel | Quarterly |
| **Performance** | Bundle size, lazy loading, render bottlenecks, Pyodide cold start | After adding new heavy modules |
| **Coverage** | Which domains/topics lack questions, cross-links, or practice modules | When planning content sprints |
| **First-Time User** | Cold walk-through in incognito — every confusion point noted live | Before any public promotion |
| **Mobile** | Safe area, touch targets, grid overflow, tap highlight, scroll behavior | After any CSS or layout change |
| **SEO / Social** | OG tags, meta descriptions, sitemap, sharing previews | Before any marketing push |
| **MVP / Weight** | Which features earn their place? Cut or consolidate candidates | When the app feels heavy |
| **IP / Moat** | What's hard to replicate? What's original? What to double down on? | Annually |

---

## Audit log

*Entries are numbered. Each entry lists: date, type, findings, and status (✅ resolved / ⚠️ open).*

— no audits run yet —
