-- Temporarily disable RLS for development with mock auth
-- We'll re-enable with proper policies once Supabase auth is implemented

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can access all distance rules" ON public.distance_rules;
DROP POLICY IF EXISTS "Tenant users can access distance rules in their tenant" ON public.distance_rules;
DROP POLICY IF EXISTS "Super admins can access all bonus offers" ON public.bonus_offers;
DROP POLICY IF EXISTS "Tenant users can access bonus offers in their tenant" ON public.bonus_offers;

-- Temporarily disable RLS for development
ALTER TABLE public.distance_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_offers DISABLE ROW LEVEL SECURITY;

-- Note: These tables will need proper RLS policies when Supabase auth is implemented
-- For now, we'll rely on application-level filtering by tenant_id