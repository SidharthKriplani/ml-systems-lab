-- ── MSL Study Room — Supabase Schema ────────────────────────────────────────
-- Run this ONCE in the Supabase SQL editor (dashboard → SQL Editor → New query).
-- Requires: Supabase project with auth enabled.
--
-- Tables:
--   study_cards    — card content (seeded by scripts/import_anki.py, never changes)
--   card_progress  — one row per (user, card), tracks SR state
--
-- RLS: each user can only read/write their own rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── study_cards ───────────────────────────────────────────────────────────────
create table if not exists study_cards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  lane       text not null,          -- 'lane1' | 'lane2' | 'lane3' | 'lane4' | 'lane5' | 'lane6'
  topic      text,                   -- sub-topic tag (optional, set during import)
  front      text not null,          -- question / prompt
  back       text not null,          -- answer / explanation
  card_type  text default 'concept', -- 'concept' | 'code' | 'system_design' | 'debug'
  created_at timestamptz default now()
);

-- ── card_progress ─────────────────────────────────────────────────────────────
create table if not exists card_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  card_id       uuid references study_cards(id) on delete cascade not null,
  interval_days int       default 0,            -- days until next review (0 = new)
  ease_factor   float     default 2.5,          -- reserved for future SM-2 upgrade
  due_date      date      default current_date, -- YYYY-MM-DD, cards are due when this <= today
  last_reviewed timestamptz,
  last_rating   smallint,                       -- 1=Again 2=Hard 3=Good 4=Easy
  created_at    timestamptz default now(),
  unique(user_id, card_id)                      -- one progress row per user per card
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Fast lookup of due cards for a user
create index if not exists idx_card_progress_due
  on card_progress(user_id, due_date);

-- Fast lookup of cards by lane for a user
create index if not exists idx_study_cards_lane
  on study_cards(user_id, lane);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table study_cards   enable row level security;
alter table card_progress enable row level security;

-- study_cards: users can only see and insert their own cards
create policy "study_cards: select own" on study_cards
  for select using (user_id = auth.uid());

create policy "study_cards: insert own" on study_cards
  for insert with check (user_id = auth.uid());

-- (no update/delete policy — cards are immutable after import)

-- card_progress: users can read/write only their own progress
create policy "card_progress: all own" on card_progress
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── Verification query (run after import to confirm) ─────────────────────────
-- select lane, count(*) as cards from study_cards where user_id = auth.uid() group by lane order by lane;
-- select count(*) as due_today from card_progress where user_id = auth.uid() and due_date <= current_date;
