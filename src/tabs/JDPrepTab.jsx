import { useEffect } from 'react'

// JD Prep has been merged into Defense Plan (DefenseDocTab).
// App.jsx renderContent intercepts currentTabId === 'jdprep' and renders DefenseDocTab directly,
// so this component is not reached in normal navigation. Kept as a safety fallback only.
export default function JDPrepTab({ onNavigate }) {
  useEffect(() => { onNavigate?.('defense') }, [onNavigate])
  return null
}
