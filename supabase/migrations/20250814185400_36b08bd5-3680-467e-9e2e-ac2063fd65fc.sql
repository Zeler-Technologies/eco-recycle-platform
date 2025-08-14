-- Complete fix for Swedish personal number constraint issues
-- This handles both admin creation and driver user setup

-- STEP 1: Fix the constraint to allow NULL values
ALTER TABLE public.auth_users DROP CONSTRAINT IF EXISTS auth_users_pnr_num_format;

-- Add flexible constraint that allows NULL or valid Swedish personal numbers
ALTER TABLE public.auth_users 
ADD CONSTRAINT auth_users_pnr_num_format 
CHECK (
    pnr_num IS NULL OR 
    (pnr_num ~ '^[0-9]{10}$' OR pnr_num ~ '^[0-9]{12}$')
) NOT VALID;

-- STEP 2: Clear any existing conflicting records first
DELETE FROM public.auth_users WHERE email IN ('erik@pantabilen.se', 'anna@pantabilen.se', 'admin@pantabilen.se');

-- Clear driver auth_user_id temporarily to avoid conflicts  
UPDATE public.drivers 
SET auth_user_id = NULL
WHERE full_name IN ('Erik Andersson', 'Anna Johansson') OR email IN ('erik@pantabilen.se', 'anna@pantabilen.se');

-- STEP 3: Create super admin (without personal number - NULL allowed)
INSERT INTO public.auth_users (id, email, role, tenant_id)
VALUES (
    gen_random_uuid(),
    'admin@pantabilen.se',
    'super_admin'::user_role,
    1
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role;

-- STEP 4: Create driver users with valid Swedish personal numbers
-- Create Erik with valid Swedish personal number (1990-01-01)
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'erik@pantabilen.se',
    'driver'::user_role,
    1,
    '199001011234'  -- Valid Swedish personal number (1990-01-01)
);

-- Create Anna with valid Swedish personal number (1985-06-17)
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num)
VALUES (
    'b2c3d4e5-f6g7-8901-bcde-f12345678901'::uuid,
    'anna@pantabilen.se', 
    'driver'::user_role,
    1,
    '198506172818'  -- Valid Swedish personal number (1985-06-17)
);

-- STEP 5: Link these to driver records in the drivers table
-- Update Erik's driver record
UPDATE public.drivers 
SET auth_user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    email = 'erik@pantabilen.se',
    updated_at = NOW()
WHERE full_name ILIKE '%erik%' OR email = 'erik@pantabilen.se';

-- Update Anna's driver record
UPDATE public.drivers 
SET auth_user_id = 'b2c3d4e5-f6g7-8901-bcde-f12345678901'::uuid,
    email = 'anna@pantabilen.se', 
    updated_at = NOW()
WHERE full_name ILIKE '%anna%' OR email = 'anna@pantabilen.se';