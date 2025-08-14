-- Create the super admin user properly
INSERT INTO public.auth_users (id, email, role, tenant_id, created_at) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  'admin@pantabilen.se', 
  'super_admin'::user_role, 
  NULL,
  now()
) ON CONFLICT (email) DO UPDATE SET 
  id = '00000000-0000-0000-0000-000000000001'::uuid,
  role = 'super_admin'::user_role,
  tenant_id = NULL;

-- Update the AuthContext mock user to match
-- Fix the is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN (
        auth.uid()::text = '00000000-0000-0000-0000-000000000001'
        OR EXISTS (
            SELECT 1 FROM public.auth_users 
            WHERE id = auth.uid() AND role = 'super_admin'::user_role
        )
    );
END;
$$;