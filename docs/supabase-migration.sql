-- =====================================================
-- Peptide Command Center - Supabase Schema Migration
-- =====================================================
-- Run this ENTIRE script in the Supabase SQL Editor.
--
-- AFTER running this:
--   1. Go to Auth > Settings > disable "Confirm email"
--   2. Sign up as Grumpy through the app
--   3. Run:  UPDATE profiles SET is_admin = true WHERE display_name = 'Grumpy';
--   4. Sign up as Karen through the app (her profile auto-populates)
--   5. Realtime is enabled at the bottom of this script
-- =====================================================

-- =====================================================
-- TABLES (must be created before the helper function)
-- =====================================================

create table public.profiles (
    id            uuid references auth.users on delete cascade primary key,
    display_name  text not null,
    is_admin      boolean default false,
    start_weight  numeric,
    goal_weight   numeric,
    calorie_target integer default 2000,
    protein_min   integer default 120,
    protein_max   integer default 150,
    fiber_target  integer default 0,
    water_target  integer default 80,
    peptide_type  text default '',
    no_go_foods   jsonb default '[]'::jsonb,
    warning_threshold numeric default 2,
    program_start date default current_date,
    current_doses jsonb default '{}'::jsonb,
    created_at    timestamptz default now()
);

create table public.daily_logs (
    id         uuid default gen_random_uuid() primary key,
    user_id    uuid references public.profiles(id) on delete cascade not null,
    log_date   date not null,
    calories   numeric,
    protein    numeric,
    weight     numeric,
    water      numeric,
    fiber      numeric,
    shots      jsonb default '{}'::jsonb,
    workout    jsonb default '{"completed":false,"notes":""}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, log_date)
);

create table public.mixed_vials (
    id         uuid default gen_random_uuid() primary key,
    peptide    text not null,
    vial_mg    numeric not null,
    water_ml   numeric not null,
    mixed_date date not null,
    depleted   boolean default false,
    created_at timestamptz default now()
);

create table public.peptide_types (
    id         uuid default gen_random_uuid() primary key,
    name       text unique not null,
    vial_size  text not null,
    created_at timestamptz default now()
);

create table public.inventory (
    id         uuid default gen_random_uuid() primary key,
    item_name  text unique not null,
    count      integer default 0
);

-- =====================================================
-- HELPER FUNCTION (created after tables exist)
-- =====================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.mixed_vials enable row level security;
alter table public.peptide_types enable row level security;
alter table public.inventory enable row level security;

-- Profiles: authenticated read all, insert own, update own (or admin updates any)
create policy "profiles_select" on public.profiles
    for select to authenticated using (true);
create policy "profiles_insert" on public.profiles
    for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on public.profiles
    for update to authenticated using (auth.uid() = id or public.is_admin());

-- Daily logs: CRUD own, admin reads all
create policy "logs_select" on public.daily_logs
    for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "logs_insert" on public.daily_logs
    for insert to authenticated with check (auth.uid() = user_id);
create policy "logs_update" on public.daily_logs
    for update to authenticated using (auth.uid() = user_id);
create policy "logs_delete" on public.daily_logs
    for delete to authenticated using (auth.uid() = user_id);

-- Mixed vials: all read, admin writes
create policy "vials_select" on public.mixed_vials
    for select to authenticated using (true);
create policy "vials_insert" on public.mixed_vials
    for insert to authenticated with check (public.is_admin());
create policy "vials_update" on public.mixed_vials
    for update to authenticated using (public.is_admin());
create policy "vials_delete" on public.mixed_vials
    for delete to authenticated using (public.is_admin());

-- Peptide types: all read, admin writes
create policy "peptides_select" on public.peptide_types
    for select to authenticated using (true);
create policy "peptides_insert" on public.peptide_types
    for insert to authenticated with check (public.is_admin());
create policy "peptides_delete" on public.peptide_types
    for delete to authenticated using (public.is_admin());

-- Inventory: all read, admin writes
create policy "inventory_select" on public.inventory
    for select to authenticated using (true);
create policy "inventory_insert" on public.inventory
    for insert to authenticated with check (public.is_admin());
create policy "inventory_update" on public.inventory
    for update to authenticated using (public.is_admin());

-- =====================================================
-- SEED DATA
-- =====================================================

insert into public.peptide_types (name, vial_size) values
    ('Retatrutide', '20mg'),
    ('Tirzepatide', '10mg'),
    ('MOTS-c', '15mg'),
    ('Glow Stack', '70mg');

insert into public.inventory (item_name, count) values
    ('Retatrutide 20mg', 0),
    ('Tirzepatide 10mg', 0),
    ('MOTS-c 15mg', 0),
    ('Glow Stack 70mg', 0);

-- =====================================================
-- ENABLE REALTIME
-- =====================================================

alter publication supabase_realtime add table public.mixed_vials;
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.peptide_types;
