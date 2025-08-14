-- Ensure the super admin user exists with proper UUID and can bypass RLS
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num, created_at) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  'admin@pantabilen.se', 
  'super_admin'::user_role, 
  NULL,
  '199001011234',
  now()
) ON CONFLICT (id) DO UPDATE SET 
  role = 'super_admin'::user_role,
  tenant_id = NULL,
  pnr_num = '199001011234';

-- Make sure is_super_admin function works correctly
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if current user is the specific super admin UUID or has super_admin role
    RETURN (
        auth.uid()::text = '00000000-0000-0000-0000-000000000001'
        OR EXISTS (
            SELECT 1 FROM public.auth_users 
            WHERE id = auth.uid() AND role = 'super_admin'::user_role
        )
    );
END;
$$;

-- Ensure tenants table can be accessed by super admin
-- Remove conflicting policies first
DROP POLICY IF EXISTS "Allow authenticated users to manage tenants" ON tenants;
DROP POLICY IF EXISTS "Allow authenticated users to view tenants" ON tenants;
DROP POLICY IF EXISTS "Allow public read access to tenants" ON tenants;
DROP POLICY IF EXISTS "Only super admins can insert tenants" ON tenants;
DROP POLICY IF EXISTS "Super admins can insert tenants" ON tenants;
DROP POLICY IF EXISTS "allow_super_admin_bypass_tenants" ON tenants;

-- Create simple policies for super admin access to tenants
CREATE POLICY "super_admin_full_access_tenants" ON tenants
    FOR ALL 
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Ensure RLS is enabled on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;