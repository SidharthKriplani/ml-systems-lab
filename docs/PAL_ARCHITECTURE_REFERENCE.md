# PAL Architecture Reference — MSL Auth Sprint Blueprint

When auth sprint starts, follow this exactly. PAL is the reference implementation.
Do NOT start the auth sprint without re-reading this document first.

---

## Tech stack

React + Vite SPA. No React Router — routing is a single `page` state string in App.jsx. All auth is Supabase (email magic link + Google OAuth + GitHub OAuth). Progress is localStorage-first, with optional Supabase sync. Deployed on Vercel.

---

## Project layout that matters

```
src/
  App.jsx                    — all routing, all auth state, all open-case handlers
  index.css                  — full CSS variable theme system
  pages/
    Home.jsx                 — signed-out full-screen landing (no sidebar)
    Progress.jsx             — signed-in home (replaces Home for authed users)
    ProfilePage.jsx          — profile, stats, sync, plans, settings
    Pricing.jsx              — plans/unlock page
  components/
    auth/AuthModal.jsx       — sign-in modal (3 methods)
    layout/Sidebar.jsx       — primary nav (only shown when signed in)
  utils/
    auth.js                  — signInWithEmail, signInWithGoogle, signInWithGitHub, signOut
    supabase.js              — supabase client (env-var gated)
    unlock.js                — access tier: anonymous / free / premium
    syncProgress.js          — push/pull progress to Supabase
```

---

## Routing system

PAL has no URL-based routing. Everything is one state variable:

```js
const [page, setPage] = useState('home');
```

`navigate(target)` just calls `setPage(target)`. The main JSX block is a chain of `if (page === 'x') return <Component />` checks. This is the entire router.

**Key rule:** when you add a new room or page, you add:
1. A `lazy()` import at the top of App.jsx
2. An open-function that calls `setPage('your-runner')`
3. A routing block in the main JSX chain

MSL already uses this pattern (`activeTab` state). Compatible as-is.

---

## Signed-out state: the layout

When `!user`, the `app-layout` div gets class `signed-out`. CSS handles the rest:

```css
.signed-out .app-sidebar    { display: none; }
.signed-out .app-main-wrapper { margin-left: 0; }
.signed-out .mobile-topbar  { display: none; }
```

The sidebar is hidden. The main content is full-width. There is no header. The signed-out experience is just the Home page, full-screen.

**MSL implication:** sidebar currently shows to everyone. When auth lands, it must only show to signed-in users.

---

## Home.jsx — signed-out landing

Full-screen centered layout, no sidebar. Key design decisions:

**Background:** Two large radial gradient orbs, absolute-positioned, animating slowly with `palLandingBgDrift` keyframe. Decorative only (`aria-hidden`, `pointer-events: none`).

**Ghost data snippets:** 8 floating ML-relevant strings (e.g. `PSI = 0.34`, `AUC drop –5.2%`, `training-serving skew`, `p99 latency 89ms`) that fade in/out at random positions. Monospace font, blurred slightly, `aria-hidden`. Hint at the content inside MSL.

**Main content:** Centered column, `maxWidth: 560px`:
1. Small badge — logo icon + "ML Systems Lab" in uppercase
2. Two-line headline — line 1 in `var(--ink-hi)`, line 2 in `var(--prime)`. MSL version: "You know the theory. / Can you debug the production failure?"
3. Subtext — one sentence on what it is, one on scope
4. Two CTAs:
   - Primary: `Sign in to practice →` — calls `onShowAuth()`
   - Secondary: `Explore without signing in` — navigates to `classical` (free tab)
5. Footer note: `Free to start · No account required for first 2 scenarios per module`

**Props:** `{ onNavigate, onShowAuth }`

---

## Auth modal — AuthModal.jsx

Triggered by `showAuth` state in App.jsx. Rendered as a fixed overlay at `z-index: 1000`.

**CRITICAL: render at the END of the App return fragment, NOT inside any panel.**
Fixed positioning is scoped to the nearest transformed ancestor. Any panel with `transform` or `position: fixed` will break the modal's viewport anchoring.

**Two steps:** `'main'` and `'sent'`.

**Main step — 3 sign-in methods:**
1. Google OAuth → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`
2. GitHub OAuth → same with `provider: 'github'`
3. Email magic link → `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })`

On email submit success: switch to `'sent'` step showing instructions.

**Loading/error state:** `loading` boolean disables all buttons. `error` string shows below form.

---

## Auth state management in App.jsx

Copy this block exactly. Do NOT simplify it.

```js
const [user, setUser] = useState(null);
const [showAuth, setShowAuth] = useState(false);

useEffect(() => {
  const { data: { subscription } } = onAuthStateChange((event, session) => {
    if (
      (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')
      && session?.user
    ) {
      setUser(session.user);
      setShowAuth(false);
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        setActiveTab(t => t === 'home' ? 'progress' : t);
      }
    } else if (event === 'SIGNED_OUT') {
      setUser(null);
      setActiveTab('home');
    }
  });
  return () => subscription.unsubscribe();
}, []);

// Reactive redirect for back-navigation edge case
useEffect(() => {
  if (user && activeTab === 'home') setActiveTab('progress');
}, [user, activeTab]);
```

**Why all three events:**
- `SIGNED_IN` — user actively logs in
- `INITIAL_SESSION` — page loads with existing session (Supabase v2). **Missing this = users appear logged out on every page refresh.**
- `TOKEN_REFRESHED` — silent JWT refresh, keeps user object current

---

## Signed-in landing: Progress page

When signed in, `activeTab` starts at `'progress'` not `'home'`. Sidebar visible. Logo click → `'progress'`.

MSL's Progress page = the HomeTab dashboard we already built (streak, section bars, guided paths). When auth lands, this becomes the authenticated home and gets cloud-synced data on top of localStorage.

---

## ProfilePage — 5 cards

**Signed-out:** single card with "Sign in to see your profile" + sign-in button.

**Signed-in:** 5 cards, `maxWidth: 700px`, centered.

### Card 1 — Identity
- Avatar: `user.user_metadata.avatar_url` or initials fallback
- Name: `user.user_metadata.full_name || user.user_metadata.name || user.user_metadata.user_name`
- Email: `user.email`
- Provider badge: from `user.app_metadata.provider` → "Google" / "GitHub" / "Email"
- Member since: `new Date(user.created_at).toLocaleDateString()`
- Sign out button → `supabase.auth.signOut()`

### Card 2 — Practice stats
- Reads all `msl_score:*` localStorage keys
- Shows: total scenarios attempted, sections active, bookmarks count — as 3 metric tiles
- Section breakdown as chips (e.g. "Features 12", "Interview 40")
- "View full progress →" link

### Card 3 — Cross-device sync
- "Sync now" → `pushProgressToSupabase(user)` then `pullProgressFromSupabase(user)`
- States: "Syncing...", "Synced ✓", "Error — retry" with 3s auto-reset

### Card 4 — Study plans
- Reads active Guided Path from localStorage
- Shows active path name + step progress + resume link

### Card 5 — Settings
- Theme toggle (light/dark)
- Export progress → JSON download
- Import progress → file input, writes keys, reloads

---

## Access tier system

```js
// utils/unlock.js
export function getAccessTier(user) {
  if (isUnlocked()) return 'premium';   // has DAI2026 code in localStorage
  if (user) return 'free';
  return 'anonymous';
}
```

| Tier | Condition | Access |
|---|---|---|
| `anonymous` | Not signed in | Only `isFree: true` scenarios |
| `free` | Signed in, no code | First 2 scenarios per module across all tabs |
| `premium` | Signed in + DAI2026 | Everything |

**Paywall in App.jsx** — intercept anonymous users:
```js
useEffect(() => {
  if (!user && GATED_TABS.has(activeTab)) setActiveTab('home');
}, [user, activeTab]);
```

**Beta state:** `isUnlocked()` currently returns true (everyone gets premium). Do not change until Stripe is wired.

---

## Supabase setup

```js
// utils/supabase.js
import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
```

All auth functions null-check `supabase` before calling. App runs in dev without env vars.

**Vercel env vars needed:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## Sidebar structure

Only visible when `user` is truthy. Grouped nav sections.
Logo click → `'progress'` (not `'home'`).

MSL sidebar sections (skill-first, not role-first):
```
Home / Progress
Features
Evaluation
Systems
Training
Data
Interview
Labs
Learn
```

---

## localStorage key convention for MSL

Current MSL keys use `msl_` prefix (underscores). Auth sprint migration:
- Shift to `msl-` hyphen prefix to match PAL convention
- Migration function on first login: read all `msl_*` keys, rewrite as `msl-*`, sync to Supabase

Current keys to migrate: `msl_score:*`, `msl_bookmarks`, `msl_streak`, `msl_last_visit`, `msl_theme`, `msl_access`, `msl_tab`

---

## Critical mistakes to avoid

**1. Missing INITIAL_SESSION.** Every page refresh silently logs the user out. Handle SIGNED_IN + INITIAL_SESSION + TOKEN_REFRESHED. Non-negotiable.

**2. Modal inside transformed ancestor.** Auth modal uses `position: fixed`. Must render at root of App return — after all panels, before closing fragment tag.

**3. Hardcoded colors.** Everything through CSS variables. Never `color: '#e8a030'`.

**4. Default exports on page components.** Use named exports. Lazy loading requires `.then(m => ({ default: m.ComponentName }))`. MSL currently uses default exports — change when auth sprint starts.

**5. Not clearing draft on submission.** Every draft key cleared in submit AND retry handler.

---

## What MSL does NOT replicate from PAL

- PAL's specific room data (rcaCases, metricsCases, etc.)
- PAL's SQL Lab
- PAL's Foundation runners
- `pal-` localStorage keys (use `msl-` prefix)
- PAL's CSS variable names verbatim (MSL has its own token system — map as needed)
