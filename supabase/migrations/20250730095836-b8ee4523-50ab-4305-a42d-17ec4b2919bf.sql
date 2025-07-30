-- Fix infinite recursion in auth_users RLS policies
-- Drop problematic policies that reference auth_users within auth_users policies
DROP POLICY IF EXISTS "Tenant admins view their tenant users" ON public.auth_users;
DROP POLICY IF EXISTS "Tenant admins update their tenant users" ON public.auth_users;
DROP POLICY IF EXISTS "Super admins view all auth users" ON public.auth_users;
DROP POLICY IF EXISTS "Super admins update all auth users" ON public.auth_users;
DROP POLICY IF EXISTS "Super admins insert auth users" ON public.auth_users;
DROP POLICY IF EXISTS "Super admins delete auth users" ON public.auth_users;
DROP POLICY IF EXISTS "Users can view own auth record" ON public.auth_users;

-- Create security definer function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS TEXT
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Use user_roles table instead of auth_users to avoid recursion
  RETURN (
    SELECT role 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Create new non-recursive policies
CREATE POLICY "Users can view own auth record" 
ON public.auth_users 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Super admins can manage all auth users" 
ON public.auth_users 
FOR ALL 
USING (public.get_user_role_safe() = 'super_admin');

CREATE POLICY "Tenant admins can view users in their tenant" 
ON public.auth_users 
FOR SELECT 
USING (
  public.get_user_role_safe() = 'tenant_admin' 
  AND tenant_id = (
    SELECT u.tenant_id 
    FROM public.auth_users u 
    WHERE u.id = auth.uid()
  )
);

CREATE POLICY "Tenant admins can update users in their tenant" 
ON public.auth_users 
FOR UPDATE 
USING (
  public.get_user_role_safe() = 'tenant_admin' 
  AND tenant_id = (
    SELECT u.tenant_id 
    FROM public.auth_users u 
    WHERE u.id = auth.uid()
  )
);