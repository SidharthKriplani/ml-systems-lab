// Activity marker — writes msl_activity_YYYY-MM-DD when the user completes a scenario.
// Imported by high-traffic tabs; HomeTab reads these keys to render the 91-day heatmap.

export function markActivity() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem(`msl_activity_${today}`, '1')
  } catch {}
}
