-- =====================================================
-- Migration 007: Protocol Overrides (per-user schedule customization)
-- =====================================================
-- Run this AFTER migration 006.
-- Purpose: add a profiles.schedule_override jsonb column so admins
-- can customize each user's weekly schedule (window + shots per day)
-- from the Admin Lab UI without redeploying.
-- =====================================================

-- 1. Add nullable jsonb column. Null = use hardcoded base schedule.
alter table public.profiles
    add column if not exists schedule_override jsonb;

-- Shape (per-day keys "0".."6", Sunday=0):
-- {
--   "1": { "window": "morning", "shots": ["Retatrutide","MOTS-c"] },
--   "3": { "window": "evening", "shots": ["Diamond Glow"] }
-- }
--
-- Days not present in the override fall back to the base schedule for that user.

comment on column public.profiles.schedule_override is
    'Per-day overrides for the hardcoded weekly schedule. Keys are day-of-week (0=Sun..6=Sat). Each value may contain "window" (morning|evening) and/or "shots" (string[]). Missing days fall back to the base schedule.';
