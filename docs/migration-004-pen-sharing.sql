-- =====================================================
-- Migration 004: Pen Sharing & Reassignment
-- =====================================================
-- Adds a `shared` boolean column to pens.
-- Three pen states:
--   shared=false, assigned_to=NULL  -> unassigned (admin only)
--   shared=false, assigned_to=UUID  -> assigned to one user
--   shared=true                     -> visible to all users
-- =====================================================

-- 1. Add the shared column
ALTER TABLE public.pens ADD COLUMN shared boolean DEFAULT false;

-- 2. Replace the select policy to include shared pens
DROP POLICY IF EXISTS "pens_select" ON public.pens;
CREATE POLICY "pens_select" ON public.pens
    FOR SELECT TO authenticated
    USING (
        auth.uid() = assigned_to
        OR shared = true
        OR public.is_admin()
    );
