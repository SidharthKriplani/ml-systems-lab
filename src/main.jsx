import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initAnalytics } from './analytics.js'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

initAnalytics()

// Root-level boundary, above <App/> itself — not just inside it. The boundary
// added inside App.jsx (wrapping renderContent()/SignedOutHome) only catches
// errors thrown by App's CHILDREN; it can't catch an error thrown during App's
// OWN function body (a hook, an effect, or any JSX outside those two specific
// spots). This one wraps the whole tree, so nothing anywhere in the app can
// unmount everything into a blank page again.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary resetKey="root">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
