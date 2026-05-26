import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || ''
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'

export function initAnalytics() {
  if (!POSTHOG_KEY) return
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    autocapture: false,
    persistence: 'localStorage',
  })
}

export function track(event, properties = {}) {
  if (!POSTHOG_KEY) return
  posthog.capture(event, properties)
}

export function trackTabSwitch(tabName) {
  track('tab_switch', { tab: tabName })
}

export function trackModuleStart(moduleName, tabName) {
  track('module_start', { module: moduleName, tab: tabName })
}

export function trackModuleComplete(moduleName, tabName, score = null) {
  track('module_complete', { module: moduleName, tab: tabName, score })
}
