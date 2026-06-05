// ── MSL Access / Unlock utilities ─────────────────────────────────────────────
//
// Single source of truth for access-code validation and tier checking.
// Import this anywhere instead of reading localStorage directly.
//
// Tier model (mirroring PAL's 3-tier structure):
//   Anonymous  → free tabs only (no code stored)
//   Code holder → all tabs unlocked (ACCESS_CODE in localStorage)
//   Stripe (future) → same as code holder, validated server-side
//
// When Stripe goes live, `isUnlocked()` should also accept a valid
// Stripe session token. The access code community tier coexists — it
// doesn't go away. No structural UI change needed at that point.

export const ACCESS_CODE = 'DAI2026'
export const STORAGE_KEY = 'msl_access'

/**
 * Returns true if the user has entered a valid access code on this device.
 * This is the single gating function — use it everywhere instead of
 * reading localStorage directly.
 */
export function isUnlocked() {
  try {
    return localStorage.getItem(STORAGE_KEY) === ACCESS_CODE
  } catch {
    return false
  }
}

/**
 * Stores the access code on this device and returns true if valid.
 * Call on successful code entry.
 */
export function unlock(code) {
  if (code?.trim().toUpperCase() === ACCESS_CODE) {
    try {
      localStorage.setItem(STORAGE_KEY, ACCESS_CODE)
    } catch {}
    return true
  }
  return false
}

/**
 * Returns the access tier for the current user.
 * 'free'    → no code stored
 * 'premium' → valid code stored
 * (future: 'stripe' → valid Stripe subscription)
 */
export function getAccessTier() {
  return isUnlocked() ? 'premium' : 'free'
}
