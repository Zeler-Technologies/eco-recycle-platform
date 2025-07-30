-- Fix the remaining policies that cause recursion
-- First, completely clear all policies from tenants table that could cause recursion
DROP POLICY IF EXISTS "Tenant admins can see their own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Tenant admins can view their own tenant" ON public.tenants;

-- Check if we have a user with super_admin role in user_roles table
-- If not, we need to insert one for the current mock user
DO $$
BEGIN
    -- Try to find if we already have a super admin
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
        -- Create a mock super admin entry for testing
        -- Using a placeholder UUID that matches the mock auth system
        INSERT INTO public.user_roles (user_id, role) 
        VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'super_admin')
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;

-- Now create completely clean policies that should work
CREATE POLICY "Allow super admins to view all tenants" 
ON public.tenants 
FOR SELECT 
USING (public.get_user_role_safe() = 'super_admin');

CREATE POLICY "Allow super admins to manage all tenants" 
ON public.tenants 
FOR ALL 
USING (public.get_user_role_safe() = 'super_admin');