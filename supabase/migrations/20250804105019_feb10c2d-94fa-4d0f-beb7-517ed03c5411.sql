-- First, drop the problematic policies
DROP POLICY IF EXISTS "Super admin manages all auth users" ON public.auth_users;
DROP POLICY IF EXISTS "Users can read own auth record" ON public.auth_users;

-- Create a security definer function to safely get user roles
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS TEXT AS $$
BEGIN
  -- This function runs with elevated privileges, bypassing RLS
  RETURN (
    SELECT role::text 
    FROM public.auth_users 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create safe RLS policies using the security definer function
CREATE POLICY "Super admin manages all auth users" ON public.auth_users
FOR ALL TO authenticated  
USING (public.get_user_role_safe() = 'super_admin');

CREATE POLICY "Users can read own auth record" ON public.auth_users
FOR SELECT TO authenticated
USING (id = auth.uid());