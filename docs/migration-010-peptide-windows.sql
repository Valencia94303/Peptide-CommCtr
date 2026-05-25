-- =====================================================
-- Migration 010: Per-peptide injection window
-- =====================================================
-- Run this AFTER migration 009.
-- Purpose: let each peptide carry its own time-of-day (morning or
--   evening) so a single day can mix morning peptides (e.g. Semax,
--   MOTS-c) with evening peptides (e.g. Diamond Glow).
--
-- Before: every day in the weekly schedule had ONE window — all of
--   that day's shots happened in either the morning OR the evening.
--   That couldn't express "Semax fasted morning + Glow at night" on
--   the same weekday.
-- After: peptide_types.default_window holds the global default
--   ('morning' | 'evening'). profiles.peptide_window_overrides lets
--   a single user re-time a peptide without affecting the rest of
--   the household. The dashboard groups today's shots into two
--   sub-cards when the day spans both windows.
-- =====================================================

-- 1. Default window per peptide type.
alter table public.peptide_types
    add column if not exists default_window text default 'morning'
        check (default_window in ('morning', 'evening'));

comment on column public.peptide_types.default_window is
    'Default time-of-day this peptide is taken: ''morning'' (typically fasted, pre-workout) or ''evening'' (typically bedtime, post-meal). Users can override this in profiles.peptide_window_overrides.';

-- 2. Per-user overrides keyed by peptide name.
--    Shape: { "<peptide name>": "morning" | "evening" }
alter table public.profiles
    add column if not exists peptide_window_overrides jsonb default '{}'::jsonb;

comment on column public.profiles.peptide_window_overrides is
    'Per-user overrides of peptide_types.default_window. Map of peptide name -> "morning" | "evening". Missing entries fall back to the type''s default_window.';

-- 3. Seed sensible defaults for the peptides that show up in the
--    built-in protocols. Anything that's always taken at bedtime
--    (Diamond Glow today; add others as needed) goes to evening.
update public.peptide_types
set default_window = 'evening'
where name in ('Diamond Glow')
  and (default_window is null or default_window = 'morning');

-- Everything else implicitly defaults to 'morning' via the column default.
