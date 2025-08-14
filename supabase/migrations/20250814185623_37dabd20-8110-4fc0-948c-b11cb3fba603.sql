-- Fix Swedish personal number constraint with VALID UUIDs
-- UUIDs must only contain 0-9 and a-f (hexadecimal)

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

-- STEP 3: Create users with auto-generated UUIDs (safer approach)
-- Create super admin (without personal number - NULL allowed)
INSERT INTO public.auth_users (id, email, role, tenant_id)
VALUES (
    gen_random_uuid(),
    'admin@pantabilen.se',
    'super_admin'::user_role,
    1
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role;

-- Create driver users with valid Swedish personal numbers
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num)
VALUES 
    (gen_random_uuid(), 'erik@pantabilen.se', 'driver'::user_role, 1, '199001011234'),
    (gen_random_uuid(), 'anna@pantabilen.se', 'driver'::user_role, 1, '198506172818')
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    pnr_num = EXCLUDED.pnr_num;

-- STEP 4: Link driver records to the generated UUIDs using subqueries
-- Update Erik's driver record
UPDATE public.drivers 
SET auth_user_id = (SELECT id FROM public.auth_users WHERE email = 'erik@pantabilen.se'),
    email = 'erik@pantabilen.se',
    updated_at = NOW()
WHERE full_name ILIKE '%erik%' OR email = 'erik@pantabilen.se';

-- Update Anna's driver record
UPDATE public.drivers 
SET auth_user_id = (SELECT id FROM public.auth_users WHERE email = 'anna@pantabilen.se'),
    email = 'anna@pantabilen.se', 
    updated_at = NOW()
WHERE full_name ILIKE '%anna%' OR email = 'anna@pantabilen.se';

-- STEP 5: Verify everything worked
SELECT 
    au.email,
    au.role,
    au.pnr_num,
    au.id as auth_user_id,
    d.full_name,
    d.auth_user_id as driver_auth_id,
    CASE 
        WHEN au.id = d.auth_user_id THEN '✅ Linked'
        ELSE '❌ Not linked'
    END as status
FROM public.auth_users au
LEFT JOIN public.drivers d ON au.id = d.auth_user_id
WHERE au.email IN ('admin@pantabilen.se', 'erik@pantabilen.se', 'anna@pantabilen.se')
ORDER BY au.role, au.email;