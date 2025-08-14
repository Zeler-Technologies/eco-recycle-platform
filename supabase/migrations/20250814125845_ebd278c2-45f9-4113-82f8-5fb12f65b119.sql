-- SYSTEM TENANT FIX - Simple Approach
-- Create the system tenant and user chain step by step

-- Step 1: Create System Tenant (ID 0)
INSERT INTO tenants (tenants_id, name, country, date, created_at)
SELECT 0, 'Platform Operations', 'SE', CURRENT_DATE, '2024-01-01 00:00:00+00'::timestamptz
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE tenants_id = 0);

-- Step 2: Update super admin to belong to system tenant
UPDATE auth_users 
SET tenant_id = 0 
WHERE role = 'super_admin'::user_role AND tenant_id IS NULL;

-- Step 3: Create user profile with system tenant
INSERT INTO "user" (user_id, tenants_id, name, email, created_at)
SELECT 
    COALESCE((SELECT MAX(user_id) FROM "user"), 0) + 1,
    0,  -- System tenant ID
    'Super Admin',
    au.email,
    NOW()
FROM auth_users au
WHERE au.role = 'super_admin'::user_role
AND NOT EXISTS (SELECT 1 FROM "user" u WHERE u.email = au.email);

-- Step 4: Add super admin role (insert only required fields)
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
    u.user_id,
    'super_admin',
    NOW()
FROM "user" u
JOIN auth_users au ON u.email = au.email
WHERE au.role = 'super_admin'::user_role
AND u.user_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'super_admin');

-- Step 5: Update RLS policy
DROP POLICY IF EXISTS "super_admin_full_access" ON tenants;
CREATE POLICY "super_admin_full_access" ON tenants
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth_users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'::user_role
        AND tenant_id = 0
    )
);

-- Step 6: Test results
SELECT 'System tenant created' as step, tenants_id, name FROM tenants WHERE tenants_id = 0;
SELECT 'Super admin updated' as step, email, tenant_id FROM auth_users WHERE role = 'super_admin'::user_role;
SELECT 'User profile created' as step, user_id, name, email FROM "user" WHERE tenants_id = 0;