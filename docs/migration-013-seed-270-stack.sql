-- =====================================================
-- Migration 013 (data): Seed the 270 lb Concentrated SubQ Stack
-- =====================================================
-- Run this AFTER migration 012 (needs the (name, vial_size) unique constraint).
-- Purpose: register the six new compounds as peptide types + inventory items.
--
-- Counts default to 1 (one vial on hand). Adjust the `count` values to match the
-- real quantities from the shipment.
-- =====================================================

-- Peptide types (name, vial_size, default_window).
-- Windows follow the 7:30 AM flow; CJC / Ipamorelin is a bedtime dose.
insert into public.peptide_types (name, vial_size, default_window) values
    ('Retatrutide',      '30mg',   'morning'),
    ('AOD-9604',         '10mg',   'morning'),
    ('5-Amino-1MQ',      '50mg',   'morning'),
    ('MOTS-c',           '40mg',   'morning'),
    ('NAD+',             '1000mg', 'morning'),
    ('CJC / Ipamorelin', '10mg',   'evening')
on conflict (name, vial_size) do nothing;

-- Inventory items follow the app convention: "<name> <size>".
insert into public.inventory (item_name, count) values
    ('Retatrutide 30mg',      1),
    ('AOD-9604 10mg',         1),
    ('5-Amino-1MQ 50mg',      1),
    ('MOTS-c 40mg',           1),
    ('NAD+ 1000mg',           1),
    ('CJC / Ipamorelin 10mg', 1)
on conflict (item_name) do nothing;
