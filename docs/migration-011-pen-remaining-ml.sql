-- =====================================================
-- Migration 011: per-pen stock tracking + pen edit support
-- =====================================================
-- Run this AFTER migration 010.
-- Purpose: let admin track how much liquid is left in each pen and
--   adjust the pen's recipe after fill (dilute with BAC water, top up
--   from a master vial, fix data-entry mistakes). Migration 002
--   shipped pens with total_ml frozen at fill time and no
--   remaining_ml column, so this adds the missing field.
-- =====================================================

-- 1. Add remaining_ml so the lab can record partial use, dilution,
--    or top-ups without losing the original total.
alter table public.pens
    add column if not exists remaining_ml numeric;

comment on column public.pens.remaining_ml is
    'Current mL of liquid left in the pen. Updated by dilute / top-up / adjust actions. Initially backfilled to total_ml on existing pens (assumes full).';

-- 2. Backfill existing pens to total_ml so dilution math has a
--    sensible starting point. Anything depleted stays depleted via
--    the depleted flag; remaining_ml is informational, not gating.
update public.pens
set remaining_ml = total_ml
where remaining_ml is null;
