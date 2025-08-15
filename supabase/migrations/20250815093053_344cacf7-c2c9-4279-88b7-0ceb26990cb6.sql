-- ===================================================================
-- Fix RLS Infinite Recursion - Complete Solution
-- ===================================================================

-- STEP 1: Drop ALL existing auth_users policies (they cause recursion)
ALTER TABLE public.auth_users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.auth_users;
DROP POLICY IF EXISTS "Allow authenticated users to view own profile" ON public.auth_users;
DROP POLICY IF EXISTS "Allow authenticated users to insert own profile" ON public.auth_users;
DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON public.auth_users;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.auth_users;
DROP POLICY IF EXISTS "Allow authenticated users to manage own profile" ON public.auth_users;
DROP POLICY IF EXISTS "Temporary development bypass" ON public.auth_users;

-- STEP 2: Create SAFE helper functions (SECURITY DEFINER)

-- Safe function to get current user's role (no recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Direct query without RLS (SECURITY DEFINER bypasses RLS)
  SELECT role INTO user_role 
  FROM public.auth_users 
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe function to check if user is super admin (no recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (public.get_current_user_role() = 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Create SAFE RLS policies (using helper functions)

-- Re-enable RLS
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can always view/edit their OWN profile
CREATE POLICY "users_own_profile" ON public.auth_users
FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 2: Super admins can view ALL profiles (using safe function)
CREATE POLICY "super_admin_all_access" ON public.auth_users
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Policy 3: Allow anonymous inserts (for user registration)
CREATE POLICY "allow_anonymous_insert" ON public.auth_users
FOR INSERT TO anon
WITH CHECK (true);

-- STEP 4: Grant permissions for helper functions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon;