// ── Progress export utility ──────────────────────────────────────────────────

export function exportProgress() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('msl_')) {
      data[key] = localStorage.getItem(key)
    }
  }
  return data
}

export function downloadProgressJSON() {
  const data = exportProgress()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().split('T')[0]
  a.href = url
  a.download = `ml-systems-lab-progress-${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
