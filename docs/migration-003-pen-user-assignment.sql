-- =====================================================
-- Migration 003: Pen User Assignment (Zero-Shared Hardware)
-- =====================================================
-- Adds assigned_to column so each pen is owned by a specific user.
-- Dashboard only shows pens assigned to the logged-in user.
-- =====================================================

alter table public.pens add column assigned_to uuid references public.profiles(id);

-- Update existing pens policy to let users see only their own pens (or admin sees all)
drop policy if exists "pens_select" on public.pens;
create policy "pens_select" on public.pens
    for select to authenticated using (auth.uid() = assigned_to or public.is_admin());
