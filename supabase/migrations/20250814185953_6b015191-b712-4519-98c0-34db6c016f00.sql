-- Fix foreign key constraint mismatch between auth.users and public.auth_users

-- OPTION 1: Remove the foreign key constraint (Recommended for now)
-- This allows drivers.auth_user_id to reference either table without DB-level constraint
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_auth_user_id_fkey;
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS fk_drivers_auth_user_id;
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_auth_user_id_fk;

-- Check what foreign key constraints exist on drivers table
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'drivers'
    AND kcu.column_name = 'auth_user_id';

-- Fix the Swedish personal number constraint first
ALTER TABLE public.auth_users DROP CONSTRAINT IF EXISTS auth_users_pnr_num_format;

ALTER TABLE public.auth_users 
ADD CONSTRAINT auth_users_pnr_num_format 
CHECK (
    pnr_num IS NULL OR 
    (pnr_num ~ '^[0-9]{10}$' OR pnr_num ~ '^[0-9]{12}$')
) NOT VALID;

-- Create admin user (no PNR required)
INSERT INTO public.auth_users (id, email, role, tenant_id)
VALUES (
    gen_random_uuid(),
    'admin@pantabilen.se',
    'super_admin',
    1
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role;

-- Create driver users with valid Swedish personal numbers
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num)
VALUES 
    (gen_random_uuid(), 'erik@pantabilen.se', 'driver', 1, '199001011234'),
    (gen_random_uuid(), 'anna@pantabilen.se', 'driver', 1, '198506172818')
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    pnr_num = EXCLUDED.pnr_num;

-- Link drivers to the generated UUIDs from public.auth_users
UPDATE drivers 
SET auth_user_id = (SELECT id FROM public.auth_users WHERE email = 'erik@pantabilen.se'),
    email = 'erik@pantabilen.se',
    updated_at = NOW()
WHERE full_name ILIKE '%erik%' OR id = '5dab13a6-d81a-4a22-8d13-e267250f2ca5';

UPDATE drivers 
SET auth_user_id = (SELECT id FROM public.auth_users WHERE email = 'anna@pantabilen.se'),
    email = 'anna@pantabilen.se',
    updated_at = NOW()
WHERE full_name ILIKE '%anna%';

-- Verify the setup
SELECT 
    'Success Check:' as status,
    au.email,
    au.role,
    au.pnr_num,
    d.full_name,
    CASE 
        WHEN d.auth_user_id IS NOT NULL THEN '✅ Driver linked'
        ELSE '❌ Driver not linked'
    END as link_status
FROM public.auth_users au
LEFT JOIN drivers d ON au.id = d.auth_user_id
WHERE au.email IN ('admin@pantabilen.se', 'erik@pantabilen.se', 'anna@pantabilen.se')
ORDER BY au.role, au.email;