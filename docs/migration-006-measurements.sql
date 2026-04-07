-- Migration 006: Body Measurements
-- Run this in the Supabase SQL Editor

-- 1. Create measurements table
create table if not exists public.measurements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    measured_date date not null,
    waist numeric,
    hips numeric,
    chest numeric,
    left_arm numeric,
    right_arm numeric,
    left_thigh numeric,
    right_thigh numeric,
    notes text,
    created_at timestamptz not null default now(),
    unique(user_id, measured_date)
);

-- 2. Enable RLS
alter table public.measurements enable row level security;

-- 3. RLS policies
create policy "measurements_select" on public.measurements
    for select to authenticated using (auth.uid() = user_id or public.is_admin());

create policy "measurements_insert" on public.measurements
    for insert to authenticated with check (auth.uid() = user_id);

create policy "measurements_update" on public.measurements
    for update to authenticated using (auth.uid() = user_id);

create policy "measurements_delete" on public.measurements
    for delete to authenticated using (auth.uid() = user_id);

-- 4. Index for fast lookups
create index if not exists idx_measurements_user_date on public.measurements(user_id, measured_date desc);
