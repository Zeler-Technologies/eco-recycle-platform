-- Emergency Fix 1: Create/Fix auth_users Table
-- Create auth_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.auth_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'driver', 'customer', 'scrapyard_admin', 'scrapyard_staff')),
  tenant_id INTEGER REFERENCES public.tenants(tenants_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pnr_num TEXT,
  pnr_num_norm TEXT
);

-- Enable RLS
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "Users can view own profile" ON public.auth_users;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.auth_users;
DROP POLICY IF EXISTS "Allow authenticated users to manage own profile" ON public.auth_users;
DROP POLICY IF EXISTS "Temporary testing bypass" ON public.auth_users;
DROP POLICY IF EXISTS "auth_users_safe_access" ON public.auth_users;

-- Create simple, working policies
CREATE POLICY "Allow authenticated users to view own profile" ON public.auth_users
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Allow authenticated users to insert own profile" ON public.auth_users
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Allow authenticated users to update own profile" ON public.auth_users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow super admins to see all profiles
CREATE POLICY "Super admins can view all profiles" ON public.auth_users
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.auth_users au
    WHERE au.id = auth.uid() 
    AND au.role = 'super_admin'
  )
);

-- Temporary bypass policy for development
CREATE POLICY "Temporary development bypass" ON public.auth_users
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);