-- Clean up authentication ID mismatch
-- Step 1: Clear conflicting auth_users records and driver links

-- Remove conflicting auth_users records for erik and anna
DELETE FROM public.auth_users 
WHERE email IN ('erik@pantabilen.se', 'anna@pantabilen.se');

-- Clear driver auth_user_id temporarily to avoid conflicts  
UPDATE public.drivers 
SET auth_user_id = NULL
WHERE full_name IN ('Erik Andersson', 'Anna Johansson');

-- Step 2: Link drivers to REAL Supabase Auth UUIDs (from auth logs)
-- These are the actual UUIDs that show up when users log in

-- Update Erik's driver record with his real Supabase Auth UUID
UPDATE public.drivers 
SET auth_user_id = 'b96da29c-3975-4e01-833c-74edf20dc408'::uuid
WHERE full_name = 'Erik Andersson';

-- Update Anna's driver record with her real Supabase Auth UUID  
UPDATE public.drivers
SET auth_user_id = '7ac68b92-ccd3-4898-9067-4547c129e564'::uuid
WHERE full_name = 'Anna Johansson';

-- Step 3: Create auth_users records using the REAL Supabase Auth UUIDs
-- These match the actual UUIDs from Supabase Authentication

-- Insert Erik's profile using his real auth UUID
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num) 
VALUES (
  'b96da29c-3975-4e01-833c-74edf20dc408'::uuid,
  'erik@pantabilen.se',
  'driver'::user_role,
  1,
  '8901234567'
);

-- Insert Anna's profile using her real auth UUID
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num)
VALUES (
  '7ac68b92-ccd3-4898-9067-4547c129e564'::uuid,
  'anna@pantabilen.se', 
  'driver'::user_role,
  1,
  '9012345678'
);

-- Step 4: Create super admin for testing
-- Generate a real UUID for super admin (you'll need to create this user in Supabase Auth)
INSERT INTO public.auth_users (id, email, role, tenant_id) 
VALUES (
  gen_random_uuid(),
  'admin@pantabilen.se',
  'super_admin'::user_role,
  NULL
) ON CONFLICT (email) DO NOTHING;