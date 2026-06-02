// ── Keyboard navigation utility for MCQ scenarios ───────────────────────────

export function setupMCQKeyboard(e, scenarioState) {
  if (!e || !scenarioState) return

  const key = e.key
  
  // Number keys 1-4 select options
  if (['1', '2', '3', '4'].includes(key)) {
    e.preventDefault()
    const optionIndex = parseInt(key) - 1
    if (scenarioState.options && optionIndex < scenarioState.options.length) {
      scenarioState.onSelectOption(optionIndex)
    }
  }

  // Enter key reveals answer if not revealed yet
  if (key === 'Enter' && !scenarioState.revealed && scenarioState.picked !== null) {
    e.preventDefault()
    scenarioState.onReveal()
  }
}
