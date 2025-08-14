-- SYSTEM TENANT FIX - Handle Existing Super Admins
-- Work with existing super admin records without modifying them

-- Step 1: Create System Tenant (ID 0) 
INSERT INTO tenants (tenants_id, name, country, date, created_at)
VALUES (
    0,
    'Platform Operations',
    'SE',
    CURRENT_DATE,
    '2024-01-01 00:00:00+00'::timestamptz
) ON CONFLICT (tenants_id) DO NOTHING;

-- Step 2: Update only valid super admins to system tenant
-- Skip the one with invalid PNR (lovable-user@system.com)
UPDATE auth_users 
SET tenant_id = 0 
WHERE role = 'super_admin'::user_role 
AND tenant_id IS NULL
AND email != 'lovable-user@system.com';  -- Skip the problematic one

-- Step 3: Create user profile for valid super admin only
INSERT INTO "user" (user_id, tenants_id, name, email, created_at)
SELECT 
    COALESCE((SELECT MAX(user_id) FROM "user"), 0) + 1,
    0,
    'Super Admin',
    au.email,
    NOW()
FROM auth_users au
WHERE au.role = 'super_admin'::user_role
AND au.email != 'lovable-user@system.com'  -- Skip problematic one
AND NOT EXISTS (SELECT 1 FROM "user" u WHERE u.email = au.email);

-- Step 4: Add to user_roles for valid super admin
INSERT INTO user_roles (user_id, role, created_at, updated_at)
SELECT 
    u.user_id,
    'super_admin',
    NOW(),
    NOW()
FROM "user" u
JOIN auth_users au ON u.email = au.email
WHERE au.role = 'super_admin'::user_role
AND au.email != 'lovable-user@system.com'
AND u.user_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'super_admin');

-- Step 5: Create flexible RLS policy that works with both admins
DROP POLICY IF EXISTS "super_admin_full_access" ON tenants;
CREATE POLICY "super_admin_full_access" ON tenants
FOR ALL USING (
    -- Allow system tenant super admins
    EXISTS (
        SELECT 1 FROM auth_users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'::user_role
        AND tenant_id = 0
    ) OR
    -- Allow super admins without tenant (fallback for lovable-user@system.com)
    EXISTS (
        SELECT 1 FROM auth_users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'::user_role
        AND tenant_id IS NULL
    )
);

-- Step 6: Verify results
SELECT 
    'Valid super admin setup:' as status,
    au.email,
    au.tenant_id,
    CASE WHEN u.user_id IS NOT NULL THEN 'Has Profile' ELSE 'No Profile' END as profile_status,
    CASE WHEN ur.role IS NOT NULL THEN 'Has Role' ELSE 'No Role' END as role_status
FROM auth_users au
LEFT JOIN "user" u ON au.email = u.email
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
WHERE au.role = 'super_admin'::user_role;