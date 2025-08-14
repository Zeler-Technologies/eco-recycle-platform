-- Create auth_users records for Erik and Anna that link to their Supabase Auth accounts
-- First, let's insert the users into auth_users table with their actual Supabase Auth IDs

-- Insert Erik (driver) - we'll use a placeholder ID that will be updated
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num, pnr_num_norm) 
VALUES (
  'b96da29c-3975-4e01-833c-74edf20dc408'::uuid,
  'erik@pantabilen.se',
  'driver'::user_role,
  1,
  '8901234567',
  '890123-4567'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  tenant_id = EXCLUDED.tenant_id,
  pnr_num = EXCLUDED.pnr_num,
  pnr_num_norm = EXCLUDED.pnr_num_norm;

-- Insert Anna (driver) - we'll use a placeholder ID that will be updated  
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num, pnr_num_norm)
VALUES (
  '7ac68b92-ccd3-4898-9067-4547c129e564'::uuid,
  'anna@pantabilen.se', 
  'driver'::user_role,
  1,
  '9012345678',
  '901234-5678'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  tenant_id = EXCLUDED.tenant_id,
  pnr_num = EXCLUDED.pnr_num,
  pnr_num_norm = EXCLUDED.pnr_num_norm;

-- Update drivers table to link to the auth users
UPDATE public.drivers 
SET auth_user_id = 'b96da29c-3975-4e01-833c-74edf20dc408'::uuid
WHERE full_name = 'Erik Andersson';

UPDATE public.drivers
SET auth_user_id = '7ac68b92-ccd3-4898-9067-4547c129e564'::uuid  
WHERE full_name = 'Anna Johansson';

-- Create a super admin user for testing
INSERT INTO public.auth_users (id, email, role, tenant_id)
VALUES (
  gen_random_uuid(),
  'admin@pantabilen.se',
  'super_admin'::user_role,
  NULL
) ON CONFLICT (email) DO NOTHING;