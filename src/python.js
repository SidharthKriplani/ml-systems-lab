/**
 * Pyodide integration — runs real Python (numpy, sklearn, matplotlib) in the browser.
 * Lazy-loads on first use. Zero backend, zero install.
 */

let pyodideInstance = null
let loadingPromise = null

export function isPyodideReady() {
  return pyodideInstance !== null
}

export async function loadPython(onProgress) {
  if (pyodideInstance) return pyodideInstance
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    onProgress?.('Loading Python runtime...')

    // Load Pyodide from CDN
    await loadScript('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js')

    onProgress?.('Initialising Python...')
    // eslint-disable-next-line no-undef
    pyodideInstance = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
    })

    onProgress?.('Loading numpy + pandas...')
    await pyodideInstance.loadPackage(['numpy', 'pandas'])

    onProgress?.('Loading scikit-learn...')
    await pyodideInstance.loadPackage(['scikit-learn'])

    onProgress?.('Loading matplotlib...')
    await pyodideInstance.loadPackage(['matplotlib'])

    onProgress?.('Loading scipy...')
    await pyodideInstance.loadPackage(['scipy'])

    // Dark-theme matplotlib default
    await pyodideInstance.runPythonAsync(`
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
plt.rcParams.update({
  'figure.facecolor':  '#05060f',
  'axes.facecolor':    '#0b0d1a',
  'axes.edgecolor':    '#1c2040',
  'axes.labelcolor':   '#8891b8',
  'axes.titlecolor':   '#eaecff',
  'xtick.color':       '#525a82',
  'ytick.color':       '#525a82',
  'text.color':        '#8891b8',
  'grid.color':        '#1c2040',
  'grid.linewidth':    0.8,
  'lines.linewidth':   2,
  'axes.spines.top':   False,
  'axes.spines.right': False,
  'figure.dpi':        120,
})
`)

    onProgress?.('Ready!')
    return pyodideInstance
  })()

  return loadingPromise
}

export async function runPython(code, globals = {}) {
  if (!pyodideInstance) throw new Error('Python not loaded yet')

  // Inject any globals
  for (const [k, v] of Object.entries(globals)) {
    pyodideInstance.globals.set(k, v)
  }

  // Capture stdout
  let stdout = ''
  pyodideInstance.setStdout({ batched: s => { stdout += s + '\n' } })

  try {
    const result = await pyodideInstance.runPythonAsync(code)
    return { ok: true, result, stdout: stdout.trim() }
  } catch (err) {
    return { ok: false, error: err.message, stdout: stdout.trim() }
  }
}

export async function runPythonWithPlot(code) {
  if (!pyodideInstance) throw new Error('Python not loaded yet')

  const wrappedCode = `
import io, base64
import matplotlib.pyplot as plt

${code}

# Capture figure as base64 PNG
_buf = io.BytesIO()
plt.savefig(_buf, format='png', bbox_inches='tight', dpi=110)
plt.close('all')
_buf.seek(0)
import base64 as _b64
_b64.b64encode(_buf.read()).decode()
`
  return runPython(wrappedCode)
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}
