// ── Auth helpers ──────────────────────────────────────────────────────────────
// All functions are no-ops when supabase is null (auth not configured).

import { supabase } from './supabase.js'

export async function signInWithGoogle() {
  if (!supabase) return
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
}

export async function signInWithGitHub() {
  if (!supabase) return
  return supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.origin },
  })
}

export async function signInWithEmail(email) {
  if (!supabase) return { error: { message: 'Auth not configured' } }
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
}

export async function signOut() {
  if (!supabase) return
  return supabase.auth.signOut()
}
