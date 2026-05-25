-- =====================================================
-- Migration 008: Titration, Cycles, and Daily Check-In
-- =====================================================
-- Run this AFTER migration 007.
-- Purpose: support three Phase 2 features at once.
--   1) Per-peptide dose titration schedules on profiles.
--   2) Per-peptide on/off cycle scheduling on profiles.
--   3) Mood / energy / NSV / notes on each daily log.
-- =====================================================

-- 1. Titration schedules: per-peptide array of {week, mg} steps.
--    Example: { "Tirzepatide": [ { "week": 1, "mg": 1.25 }, { "week": 5, "mg": 2.5 } ] }
alter table public.profiles
    add column if not exists titration_schedules jsonb;

comment on column public.profiles.titration_schedules is
    'Per-peptide dose escalation schedules. Map of peptide name -> [{ "week": int, "mg": numeric }]. "week" is week-of-program-start (1-indexed). The dashboard surfaces a banner when the user reaches a scheduled step.';

-- 2. Peptide cycles: configure on/off cycling per peptide.
--    Example: { "MOTS-c": { "on_weeks": 5, "off_weeks": 4, "anchor_date": "2026-03-25" } }
alter table public.profiles
    add column if not exists peptide_cycles jsonb;

comment on column public.profiles.peptide_cycles is
    'Per-peptide cycling configuration. Map of peptide name -> { "on_weeks": int, "off_weeks": int, "anchor_date": "YYYY-MM-DD" }. During an off-week, getSchedule() drops the peptide from that day. Missing entries default to always-on.';

-- 3. Daily check-in fields on daily_logs.
alter table public.daily_logs
    add column if not exists mood smallint,
    add column if not exists energy smallint,
    add column if not exists nsv text,
    add column if not exists notes text;

comment on column public.daily_logs.mood is 'Daily mood, 1 (rough) to 5 (great). Null if not entered.';
comment on column public.daily_logs.energy is 'Daily energy, 1 (drained) to 5 (high). Null if not entered.';
comment on column public.daily_logs.nsv is 'Non-scale victory text for the day (clothes fit, mood, sleep, etc.). Optional.';
comment on column public.daily_logs.notes is 'Free-text journal entry for the day. Optional.';
