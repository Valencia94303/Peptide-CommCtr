-- =====================================================
-- Migration 009: Peptide-relative titration anchors
-- =====================================================
-- Run this AFTER migration 008.
-- Purpose: make titration step weeks relative to *when each peptide
--   was started* rather than the user's overall program start.
--
-- Before this migration, `titration_schedules.<peptide>[].week` was
-- counted from `profiles.program_start`. That broke down when a user
-- added a peptide mid-program: to make the first step fire "now",
-- they had to enter their current program week (e.g. 9), and the
-- step-up banner read "Week 9 protocol" — confusing for a peptide
-- the user had just started.
--
-- After this migration, each peptide has its own anchor date stored
-- in `profiles.titration_anchors`. Step weeks are interpreted as
-- "weeks since that anchor" — so "Wk 1" means the first week on
-- that peptide, regardless of program week.
-- =====================================================

-- 1. Per-peptide titration anchor dates.
--    Shape: { "<peptide name>": "YYYY-MM-DD", ... }
--    Missing entries fall back to profiles.program_start so existing
--    schedules continue to behave exactly as before.
alter table public.profiles
    add column if not exists titration_anchors jsonb default '{}'::jsonb;

comment on column public.profiles.titration_anchors is
    'Per-peptide titration anchor dates. Map of peptide name -> "YYYY-MM-DD". Step weeks in titration_schedules are interpreted as 1-indexed weeks since this anchor. Missing entries fall back to profiles.program_start for backwards compatibility.';

-- 2. Backfill: for every peptide that already has a titration schedule,
--    set its anchor to the profile's program_start. This guarantees
--    existing schedules (Retatrutide, MOTS-c, Tirzepatide, etc.) keep
--    firing on exactly the same calendar week they fired on before.
update public.profiles
set titration_anchors = coalesce(titration_anchors, '{}'::jsonb) || (
    select coalesce(jsonb_object_agg(k, program_start), '{}'::jsonb)
    from jsonb_object_keys(coalesce(titration_schedules, '{}'::jsonb)) as k
    where program_start is not null
)
where titration_schedules is not null
  and titration_schedules <> '{}'::jsonb
  and program_start is not null;

-- 3. Update the comment on titration_schedules to reflect the new
--    semantics.
comment on column public.profiles.titration_schedules is
    'Per-peptide dose escalation schedules. Map of peptide name -> [{ "week": int, "mg": numeric }]. "week" is 1-indexed weeks since profiles.titration_anchors.<peptide> (or program_start as a fallback). The dashboard surfaces a banner when the user reaches a scheduled step.';
