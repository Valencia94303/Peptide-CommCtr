-- =====================================================
-- Migration 014: add "postbreakfast" injection window
-- =====================================================
-- Run this AFTER migration 013.
-- Purpose: the app now supports three injection windows instead of two
-- (morning = fasted, postbreakfast = with/after first meal, evening = bedtime).
-- NAD+ moves to the post-breakfast window per the 270lb protocol.
-- =====================================================

-- Widen the default_window check constraint to allow the new value.
alter table public.peptide_types
    drop constraint if exists peptide_types_default_window_check;

alter table public.peptide_types
    add constraint peptide_types_default_window_check
    check (default_window = any (array['morning'::text, 'postbreakfast'::text, 'evening'::text]));

-- NAD+ is a post-breakfast dose (taken with/after the first protein meal).
update public.peptide_types set default_window = 'postbreakfast' where name = 'NAD+';

-- Note: profiles.peptide_window_overrides is plain JSONB with no DB-level check;
-- the client validates window values via isShotWindow() before writing.
