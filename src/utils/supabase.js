// ── Supabase client — env-var gated ──────────────────────────────────────────
//
// App runs in localStorage-only mode when env vars are absent.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel env vars.
// See docs/SETUP_AUTH.md for full setup guide.
//
// Install: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const authEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = authEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

/**
 * Wraps supabase.auth.onAuthStateChange with a no-op fallback.
 * Always call .data.subscription.unsubscribe() in useEffect cleanup.
 */
export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange(callback)
}
