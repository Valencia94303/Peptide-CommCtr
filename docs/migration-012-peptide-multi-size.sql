-- Migration 012: allow multiple vial sizes per peptide type
--
-- Previously peptide_types.name carried a UNIQUE constraint, so a peptide could
-- only ever have one vial size on record. That blocked tracking, e.g., MOTS-c at
-- both 15mg and 40mg. This switches the uniqueness to the (name, vial_size) pair,
-- so the same peptide can be stocked in multiple sizes while still preventing
-- exact duplicates.
--
-- Safe to re-run: the drop is guarded with IF EXISTS and the add is guarded by a
-- prior drop of the same-named constraint.

alter table public.peptide_types
    drop constraint if exists peptide_types_name_key;

alter table public.peptide_types
    drop constraint if exists peptide_types_name_vial_size_key;

alter table public.peptide_types
    add constraint peptide_types_name_vial_size_key unique (name, vial_size);
