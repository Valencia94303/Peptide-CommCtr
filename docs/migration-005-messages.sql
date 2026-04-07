-- Migration 005: Household Messages
-- Run this in the Supabase SQL Editor

-- 1. Create messages table
create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    text text not null,
    created_at timestamptz not null default now()
);

-- 2. Enable RLS
alter table public.messages enable row level security;

-- 3. RLS policies: any authenticated user can read all messages
create policy "messages_select" on public.messages
    for select to authenticated using (true);

-- 4. Users can insert their own messages
create policy "messages_insert" on public.messages
    for insert to authenticated with check (auth.uid() = user_id);

-- 5. Only the author or admin can delete
create policy "messages_delete" on public.messages
    for delete to authenticated using (auth.uid() = user_id or public.is_admin());

-- 6. Add to realtime publication
alter publication supabase_realtime add table public.messages;

-- 7. Index for fast chronological queries
create index if not exists idx_messages_created on public.messages(created_at desc);
