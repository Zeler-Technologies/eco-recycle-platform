-- Check and fix tenants table RLS policies that might be causing recursion
-- First, let's see what policies exist on tenants table
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tenants';

-- Drop any potentially problematic policies on tenants table
DROP POLICY IF EXISTS "Admins can access all tenant records" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can see all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can delete tenants" ON public.tenants;
DROP POLICY IF EXISTS "Only super admins can update tenants" ON public.tenants;
DROP POLICY IF EXISTS "Only super admins can delete tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenant admins can see their own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Tenant admins can view their own tenant" ON public.tenants;

-- Create simple, non-recursive policies for tenants table
CREATE POLICY "Super admins can manage all tenants" 
ON public.tenants 
FOR ALL 
USING (public.get_user_role_safe() = 'super_admin');

CREATE POLICY "Tenant admins can view their own tenant" 
ON public.tenants 
FOR SELECT 
USING (
  public.get_user_role_safe() = 'tenant_admin' 
  AND tenants_id = (
    SELECT tenant_id 
    FROM public.auth_users 
    WHERE id = auth.uid()
  )
);

-- Also ensure the function exists and works correctly
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS TEXT
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- First try to get role from user_roles table to avoid recursion
  RETURN (
    SELECT role 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN
  -- Fallback: return null if there's any error
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;