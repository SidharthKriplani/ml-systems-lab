# Interview Experience Submission Form — Tally.so Spec

**Form Name:** Interview Experience Submission  
**Status:** Awaiting creation in Tally.so  
**Live URL:** (Avinash to provide after creation)  
**Internal reference:** `wMRZzZ` (placeholder, replace when actual URL is available)

---

## Field Specifications (In Order)

### 1. Your name
- **Type:** Short text
- **Required:** Yes
- **Placeholder:** "e.g., Priya P."
- **Description:** Full name or pseudonym for attribution

### 2. Company
- **Type:** Short text
- **Required:** Yes
- **Placeholder:** "e.g., Google, Meta, Stripe"
- **Description:** Company where the interview took place

### 3. Role applied for
- **Type:** Short text
- **Required:** Yes
- **Placeholder:** "e.g., ML Engineer, MLOps, Research Scientist"
- **Description:** Specific role title

### 4. Years of experience
- **Type:** Number input
- **Required:** Yes
- **Min:** 0
- **Max:** 20
- **Description:** Total years of professional experience

### 5. Interview round
- **Type:** Multiple choice (single select)
- **Required:** Yes
- **Options:**
  - Behavioral
  - System Design
  - Coding
  - Deep Dive
  - Take-home
- **Description:** Primary round type in the interview

### 6. Interview date
- **Type:** Date picker
- **Required:** Yes
- **Format:** YYYY-MM (month/year)
- **Description:** When the interview took place

### 7. Skills covered
- **Type:** Checkboxes (multi-select)
- **Required:** Yes (at least one)
- **Options:**
  - ml_fundamentals
  - statistics
  - system_design
  - coding_ml
  - coding_general
  - experimentation
  - product_sense
  - deep_learning
  - sql
  - behavioral
- **Description:** Which technical/soft skills were tested

### 8. How did you prepare?
- **Type:** Short text
- **Required:** No
- **Placeholder:** "e.g., ML Systems Lab + AlgoExpert + Practice questions"
- **Description:** Resources used to prepare (free text)

### 9. Outcome
- **Type:** Multiple choice (single select)
- **Required:** Yes
- **Options:**
  - Offer
  - Reject
  - Pending
  - Advance to next round
- **Description:** Interview outcome

### 10. Any tips for others?
- **Type:** Long text (textarea)
- **Required:** No
- **Placeholder:** "Share advice, unexpected questions, or lessons learned..."
- **Description:** Open-ended feedback for future candidates

---

## Submission Configuration

- **Confirmation message:** "Thank you! Your experience helps build our community interview insights."
- **Redirect on success:** (optional) Could point to `/interview` tab
- **Email notifications:** Send to `claudesubscription12@gmail.com` on each submission

---

## Data Schema (for downstream processing)

Each Tally submission maps to this schema in `src/data/interviewExperiences.js`:

```javascript
{
  id: 'exp_XXX',                    // Generated: exp_001, exp_002, etc.
  name: string,                     // From field #1
  company: string,                  // From field #2
  role: string,                     // From field #3
  yearsExp: number,                 // From field #4
  round: string,                    // From field #5
  date: string,                     // From field #6 (YYYY-MM format)
  tags: string[],                   // From field #7 (checkbox values)
  prepSource: string,               // From field #8
  result: string,                   // From field #9
}
```

---

## Admin Workflow (see InterviewGrid in src/App.jsx)

1. Monitor Tally submissions as they arrive
2. Once N >= 15 real submissions collected:
   - Download JSON export from Tally dashboard
   - Format each entry to the schema above
   - Add to `INTERVIEW_EXPERIENCES` array in `src/data/interviewExperiences.js`
   - Commit + push
3. `TagFrequencyChart` component automatically re-renders with live skill coverage

---

## Notes

- Current seed data: 15 demo records (all marked "Offer" for testing)
- Form is external (Tally.so)—no backend integration needed
- App uses localStorage only; Tally submission data downloaded manually by admin
- Once real submissions exist, they gradually replace seed data
