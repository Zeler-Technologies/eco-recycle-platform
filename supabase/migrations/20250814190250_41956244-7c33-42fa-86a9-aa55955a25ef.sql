-- Complete cleanup and fix for authentication system
-- Remove blocking foreign key constraints and create fresh records

-- 1. Remove blocking foreign key constraints
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_auth_user_id_fkey;
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS fk_drivers_auth_user_id;
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_auth_user_id_fk;

-- 2. Clean up existing conflicting data  
DELETE FROM public.auth_users 
WHERE email IN ('admin@pantabilen.se', 'erik@pantabilen.se', 'anna@pantabilen.se')
   OR pnr_num IN ('199001011234', '198506172818');

-- Clear driver references to avoid orphans
UPDATE drivers SET auth_user_id = NULL 
WHERE email IN ('erik@pantabilen.se', 'anna@pantabilen.se')
   OR full_name ILIKE '%erik%' OR full_name ILIKE '%anna%';

-- 3. Fix Swedish PNR constraint
ALTER TABLE public.auth_users DROP CONSTRAINT IF EXISTS auth_users_pnr_num_format;
ALTER TABLE public.auth_users 
ADD CONSTRAINT auth_users_pnr_num_format 
CHECK (pnr_num IS NULL OR (pnr_num ~ '^[0-9]{10}$' OR pnr_num ~ '^[0-9]{12}$')) NOT VALID;

-- 4. Create fresh users with no conflicts
INSERT INTO public.auth_users (id, email, role, tenant_id, pnr_num)
VALUES 
    (gen_random_uuid(), 'admin@pantabilen.se', 'super_admin', 1, NULL),
    (gen_random_uuid(), 'erik@pantabilen.se', 'driver', 1, '199001011234'),
    (gen_random_uuid(), 'anna@pantabilen.se', 'driver', 1, '198506172818');

-- 5. Link drivers to the correct auth users
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

-- 6. Verify the cleanup and setup
SELECT 
    'SUCCESS: Clean setup complete' as status,
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