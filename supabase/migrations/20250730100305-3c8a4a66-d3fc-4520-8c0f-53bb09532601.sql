-- Create proper user_roles entry for the mock super admin user
-- Using a properly formatted UUID for the mock user
-- Clear any existing entries first to avoid conflicts
DELETE FROM public.user_roles WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Insert the correct super admin role for the mock user using a proper UUID
INSERT INTO public.user_roles (user_id, role) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'super_admin')
ON CONFLICT DO NOTHING;

-- Also ensure we have the proper auth_users record if it doesn't exist
INSERT INTO public.auth_users (id, email, role, pnr_num, tenant_id) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'admin@superadmin.com', 'super_admin', null, null)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;