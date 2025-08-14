-- COMPLETE USER CHAIN FIX
-- Step 1: Check the current state and table relationships

-- Check what we have in auth_users (your custom table)
SELECT 'Auth users (custom table):' as check_type, 
       id, email, role::text, tenant_id 
FROM auth_users 
WHERE role::text = 'super_admin';

-- Check what we have in user table (user profiles)
SELECT 'User profiles:' as check_type, COUNT(*) 
FROM "user";

-- Check user_roles references
SELECT 'User roles:' as check_type, COUNT(*) 
FROM user_roles;

-- Step 2: Create user profile in the 'user' table
-- Note: user.user_id is bigint, so we need to generate one
INSERT INTO "user" (user_id, tenants_id, name, email, created_at)
SELECT 
    -- Generate a unique bigint ID (you might want to use a sequence)
    COALESCE((SELECT MAX(user_id) FROM "user"), 0) + 1,
    au.tenant_id,
    COALESCE(au.email, 'Super Admin'),  -- use email as name if no name available
    au.email,
    NOW()
FROM auth_users au
WHERE au.role::text = 'super_admin'
AND NOT EXISTS (
    SELECT 1 FROM "user" u 
    WHERE u.email = au.email
);

-- Step 3: Get the user_id we just created
SELECT 'Created user profile:' as info,
       user_id, tenants_id, name, email
FROM "user" 
WHERE email IN (
    SELECT email FROM auth_users WHERE role::text = 'super_admin'
);

-- Step 4: Insert into user_roles using the bigint user_id
INSERT INTO user_roles (user_id, role, scrapyard_id, created_at, updated_at)
SELECT 
    u.user_id,              -- bigint from user table
    'super_admin',          -- text role
    NULL,                   -- no specific scrapyard for super admin
    NOW(),
    NOW()
FROM "user" u
JOIN auth_users au ON u.email = au.email
WHERE au.role::text = 'super_admin'
AND u.user_id NOT IN (
    SELECT user_id FROM user_roles 
    WHERE role = 'super_admin' 
    AND user_id IS NOT NULL
);

-- Step 5: Verify the complete chain
SELECT 
    'Complete user chain verification:' as check_type,
    au.id as auth_users_id,
    au.email as auth_email,
    au.role::text as auth_role,
    u.user_id as user_profile_id,
    u.name as user_name,
    ur.role as user_role
FROM auth_users au
JOIN "user" u ON au.email = u.email
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
WHERE au.role::text = 'super_admin';

-- Step 6: Update RLS policy to work with the correct user chain
DROP POLICY IF EXISTS "super_admin_full_access" ON tenants;
CREATE POLICY "super_admin_full_access" ON tenants
FOR ALL USING (
    -- Check through the complete user chain
    EXISTS (
        SELECT 1 
        FROM auth_users au
        JOIN "user" u ON au.email = u.email
        JOIN user_roles ur ON u.user_id = ur.user_id
        WHERE au.id = auth.uid() 
        AND ur.role = 'super_admin'
    ) OR 
    -- Fallback: direct check in auth_users
    EXISTS (
        SELECT 1 FROM auth_users 
        WHERE id = auth.uid() 
        AND role::text = 'super_admin'
    )
);

-- Step 7: Test tenant access
SELECT 
    'Final tenant access test:' as test_name,
    COUNT(*) as visible_tenants,
    CASE 
        WHEN COUNT(*) = 0 THEN 'STILL BLOCKED - Check RLS policies'
        ELSE CONCAT('SUCCESS! Super admin can see ', COUNT(*), ' tenants')
    END as result
FROM tenants;

-- Step 8: Show sample tenants if access works
SELECT 
    'Sample tenants visible to super admin:' as info,
    tenants_id,
    name,
    service_type,
    country,
    created_at
FROM tenants 
ORDER BY created_at DESC 
LIMIT 3;