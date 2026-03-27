-- =====================================================
-- Migration 002: Two-Tier Mixing (Master Vials + Pens)
-- =====================================================
-- Run this AFTER the initial migration.
-- Adds master_vials and pens tables for the two-step
-- reconstitution workflow:
--   1. Reconstitute a Master Vial (mother vial)
--   2. Fill secondary Pens from the Master
-- =====================================================

-- Master Vials (mother vials - initial reconstitution)
create table public.master_vials (
    id             uuid default gen_random_uuid() primary key,
    peptide        text not null,
    total_mg       numeric not null,
    total_ml       numeric not null,
    concentration  numeric not null,    -- mg/mL = total_mg / total_ml
    remaining_ml   numeric not null,    -- decrements as pens are filled
    mixed_date     date not null,
    depleted       boolean default false,
    created_at     timestamptz default now()
);

-- Pens (secondary 3mL pens filled from masters)
create table public.pens (
    id               uuid default gen_random_uuid() primary key,
    master_vial_id   uuid references public.master_vials(id),
    peptide          text not null,
    ml_from_master   numeric not null,  -- mL drawn from master
    ml_fresh_water   numeric not null,  -- mL of fresh BAC water added
    total_ml         numeric not null,  -- ml_from_master + ml_fresh_water
    mg_content       numeric not null,  -- master_concentration * ml_from_master
    concentration    numeric not null,  -- mg_content / total_ml (mg/mL)
    filled_date      date not null,
    depleted         boolean default false,
    created_at       timestamptz default now()
);

-- RLS
alter table public.master_vials enable row level security;
alter table public.pens enable row level security;

-- Master vials: all read, admin writes
create policy "masters_select" on public.master_vials
    for select to authenticated using (true);
create policy "masters_insert" on public.master_vials
    for insert to authenticated with check (public.is_admin());
create policy "masters_update" on public.master_vials
    for update to authenticated using (public.is_admin());
create policy "masters_delete" on public.master_vials
    for delete to authenticated using (public.is_admin());

-- Pens: all read, admin writes
create policy "pens_select" on public.pens
    for select to authenticated using (true);
create policy "pens_insert" on public.pens
    for insert to authenticated with check (public.is_admin());
create policy "pens_update" on public.pens
    for update to authenticated using (public.is_admin());
create policy "pens_delete" on public.pens
    for delete to authenticated using (public.is_admin());

-- Enable realtime
alter publication supabase_realtime add table public.master_vials;
alter publication supabase_realtime add table public.pens;
