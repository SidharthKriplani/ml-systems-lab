# SETUP_AUTH.md — Auth Sprint Setup Guide

Follow these steps exactly. Do them in order. Takes ~20 minutes.

---

## 1. Install the Supabase package

```bash
cd ~/Documents/GitHub/ml-systems-lab
npm install @supabase/supabase-js
```

---

## 2. Create a Supabase project

1. Go to https://supabase.com and create a new project
2. Note down: **Project URL** and **Anon (public) key** from Settings → API

---

## 3. Create the user_progress table

In Supabase SQL Editor, run:

```sql
CREATE TABLE user_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  key         text NOT NULL,
  value       text NOT NULL,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, key)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access their own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 4. Enable OAuth providers

In Supabase Dashboard → Authentication → Providers:

**Google:**
1. Enable Google provider
2. Go to Google Cloud Console → APIs → Credentials → Create OAuth 2.0 Client
3. Authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret into Supabase

**GitHub:**
1. Enable GitHub provider
2. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
3. Homepage URL: `https://ml-systems-lab-v9xe.vercel.app`
4. Authorization callback URL: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
5. Copy Client ID and Secret into Supabase

---

## 5. Add redirect URL

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://ml-systems-lab-v9xe.vercel.app`
- Add redirect URL: `https://ml-systems-lab-v9xe.vercel.app`
- Also add: `http://localhost:5173` (for local dev)

---

## 6. Set Vercel environment variables

In Vercel dashboard → Settings → Environment Variables, add:

```
VITE_SUPABASE_URL        = https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY   = eyJhbGci...your-anon-key...
```

Redeploy after adding. The app runs in localStorage-only mode without these — nothing breaks locally.

---

## 7. Test locally

```bash
# Create .env.local (never commit this file)
echo "VITE_SUPABASE_URL=https://xxxx.supabase.co" >> .env.local
echo "VITE_SUPABASE_ANON_KEY=eyJhbGci..." >> .env.local

npm run dev
```

Open http://localhost:5173 — you should see a "Sign in" button in the topbar when authEnabled=true.

---

## 8. What authEnabled does

`authEnabled` in `src/utils/supabase.js` = `!!(VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY)`.

- `authEnabled = false` (no env vars): App behaves exactly as before — no sign-in UI, localStorage-only, sidebar always visible
- `authEnabled = true` (env vars present): Sign-in button appears in topbar, AuthModal is live, signed-out users see SignedOutHome

---

## Architecture reference

| File | Purpose |
|------|---------|
| `src/utils/supabase.js` | Supabase client (env-var gated) |
| `src/utils/auth.js` | signInWithGoogle/GitHub/Email, signOut |
| `src/utils/syncProgress.js` | push/pull all msl_* keys to user_progress table |
| `src/components/auth/AuthModal.jsx` | Sign-in modal (Google, GitHub, email magic link) |
| `src/tabs/SignedOutHome.jsx` | Full-screen landing when !user + auth enabled |
| `src/tabs/ProfilePage.jsx` | Profile, stats, sync, study plans, settings |

**When Stripe goes live:** `isUnlocked()` in `src/utils/unlock.js` is the only function to update. It already returns `'premium'` for valid access codes — add a Stripe subscription check alongside it. No structural UI change needed.
