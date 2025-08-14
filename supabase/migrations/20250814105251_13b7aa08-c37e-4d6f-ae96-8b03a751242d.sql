-- Fix the super admin user with a valid pnr_num
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num, created_at) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  'admin@pantabilen.se', 
  'super_admin'::user_role, 
  NULL,
  '199001011234', -- Valid Swedish personal number format
  now()
) ON CONFLICT (id) DO UPDATE SET 
  role = 'super_admin'::user_role,
  tenant_id = NULL,
  pnr_num = '199001011234';

-- Also update by email in case there's a conflict
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num, created_at) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  'admin@pantabilen.se', 
  'super_admin'::user_role, 
  NULL,
  '199001011234',
  now()
) ON CONFLICT (email) DO UPDATE SET 
  id = '00000000-0000-0000-0000-000000000001'::uuid,
  role = 'super_admin'::user_role,
  tenant_id = NULL,
  pnr_num = '199001011234';