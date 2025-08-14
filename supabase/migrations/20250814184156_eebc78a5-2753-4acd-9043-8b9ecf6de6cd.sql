-- Create auth_users records for Erik and Anna that link to their Supabase Auth accounts
-- Using the actual Auth user IDs from the logs

-- Insert Erik (driver) 
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num) 
VALUES (
  'b96da29c-3975-4e01-833c-74edf20dc408'::uuid,
  'erik@pantabilen.se',
  'driver'::user_role,
  1,
  '8901234567'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  tenant_id = EXCLUDED.tenant_id,
  pnr_num = EXCLUDED.pnr_num;

-- Insert Anna (driver)
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num)
VALUES (
  '7ac68b92-ccd3-4898-9067-4547c129e564'::uuid,
  'anna@pantabilen.se', 
  'driver'::user_role,
  1,
  '9012345678'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  tenant_id = EXCLUDED.tenant_id,
  pnr_num = EXCLUDED.pnr_num;

-- Update drivers table to link to the auth users
UPDATE public.drivers 
SET auth_user_id = 'b96da29c-3975-4e01-833c-74edf20dc408'::uuid
WHERE full_name = 'Erik Andersson';

UPDATE public.drivers
SET auth_user_id = '7ac68b92-ccd3-4898-9067-4547c129e564'::uuid  
WHERE full_name = 'Anna Johansson';