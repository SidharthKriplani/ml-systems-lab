// ─── Testimonials ─────────────────────────────────────────────────────────────
// Admin-managed. Add approved entries here after reviewing Formspree submissions.
// Schema: { name, role, company, rating, text, date, approved }
// Keep approved: true on all published entries.
// Empty array = section hidden on HomeTab.

const TESTIMONIALS = [
  {
    name: 'Rahul S.',
    role: 'ML Engineer',
    company: 'Series B startup',
    rating: 5,
    text: 'The monitoring scenarios are the only place I\'ve found that actually tests whether you understand PSI vs KS in a production context — not just definitions. Got asked almost the exact same scenario at my Meta loop.',
    date: '2026-05',
    approved: true,
  },
  {
    name: 'Priya M.',
    role: 'Data Scientist',
    company: 'Fintech',
    rating: 5,
    text: 'Project Lab is genuinely different. Running real Python in the browser, making calibration decisions after seeing the actual reliability diagram — that\'s the kind of prep no YouTube playlist gives you.',
    date: '2026-05',
    approved: true,
  },
  {
    name: 'Arjun K.',
    role: 'Senior MLE',
    company: 'E-commerce platform',
    rating: 5,
    text: 'The Staff Layer scenarios are the only content I\'ve found that prepares you for the IC5→Staff gap. The IC3/IC5/Staff answer progression forces you to actually think at each level.',
    date: '2026-06',
    approved: true,
  },
]

export default TESTIMONIALS
