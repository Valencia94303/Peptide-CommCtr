-- =====================================================
-- Migration 009: Gemini AI Coach
-- =====================================================
-- Run this AFTER migration 008.
-- Purpose: support the AI coach feature with three surfaces:
--   1) Daily summary card on the dashboard (cached once per day per user).
--   2) Weekly review (cached once per ISO week per user).
--   3) Persistent chat history on a dedicated Coach screen.
-- =====================================================

-- 1. Cached summaries live on the profile, since they're one-per-user.
alter table public.profiles
    add column if not exists coach_cache jsonb;

comment on column public.profiles.coach_cache is
    'Cached coach output. Shape: { "daily": { "date": "YYYY-MM-DD", "text": "..." }, "weekly": { "week_ending": "YYYY-MM-DD", "text": "..." } }. Regenerated when the cached date no longer matches the current period.';

-- 2. Persistent chat messages for the Coach screen.
create table if not exists public.coach_messages (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    role text not null check (role in ('user','assistant','system')),
    content text not null,
    created_at timestamptz not null default now()
);

alter table public.coach_messages enable row level security;

create policy "coach_messages_select" on public.coach_messages
    for select to authenticated using (auth.uid() = user_id);

create policy "coach_messages_insert" on public.coach_messages
    for insert to authenticated with check (auth.uid() = user_id);

create policy "coach_messages_delete" on public.coach_messages
    for delete to authenticated using (auth.uid() = user_id);

-- No update policy: messages are append-only once written.

create index if not exists idx_coach_messages_user_created
    on public.coach_messages(user_id, created_at desc);
