-- DIAGNOSED ISSUE: Super admin exists in auth_users but not user_roles
-- user_roles.role is TEXT, not ENUM, so we use 'super_admin' as text

-- STEP 1: Verify current state
SELECT 'Auth users with super admin role:' as check_type, COUNT(*) 
FROM auth_users WHERE role::text = 'super_admin';

SELECT 'Current user_roles records:' as check_type, COUNT(*) 
FROM user_roles;

SELECT 'Current tenants count:' as check_type, COUNT(*) 
FROM tenants;

-- STEP 2: Get your super admin user details
SELECT 
    'Super admin user details:' as info,
    id as user_id,
    email,
    role::text as role_text,
    tenant_id
FROM auth_users 
WHERE role::text = 'super_admin';

-- STEP 3: Insert super admin into user_roles table
-- Note: user_roles.role is TEXT type, scrapyard_id can be NULL for super admin
INSERT INTO user_roles (user_id, role, scrapyard_id)
SELECT 
    au.id,                    -- uuid from auth_users
    'super_admin',            -- text (not enum)
    NULL                      -- super admin not tied to specific scrapyard
FROM auth_users au
WHERE au.role::text = 'super_admin'
AND au.id NOT IN (
    SELECT user_id FROM user_roles 
    WHERE role = 'super_admin' 
    AND user_id IS NOT NULL
);

-- STEP 4: Verify the insert worked
SELECT 
    'User roles after insert:' as verification,
    ur.user_id,
    ur.role,
    ur.scrapyard_id,
    au.email
FROM user_roles ur
JOIN auth_users au ON ur.user_id = au.id
WHERE ur.role = 'super_admin';

-- STEP 5: Create/update RLS policy to check BOTH tables
-- Drop any conflicting policies first
DROP POLICY IF EXISTS "emergency_super_admin_access" ON tenants;
DROP POLICY IF EXISTS "Super admins can view all tenants" ON tenants;

-- Create comprehensive super admin policy
CREATE POLICY "super_admin_full_access" ON tenants
FOR ALL USING (
    -- Check user_roles table (primary)
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    ) OR 
    -- Fallback: check auth_users table
    EXISTS (
        SELECT 1 FROM auth_users 
        WHERE id = auth.uid() 
        AND role::text = 'super_admin'
    )
);

-- STEP 6: Test tenant access
SELECT 
    'Tenant access test:' as test_name,
    COUNT(*) as visible_tenants,
    CASE 
        WHEN COUNT(*) = 0 THEN 'FAILED - Still blocked'
        ELSE CONCAT('SUCCESS - Can see ', COUNT(*), ' tenants!')
    END as result
FROM tenants;

-- STEP 7: Show sample tenants (if access works)
SELECT 
    'Sample tenants:' as info,
    tenants_id,
    name,
    service_type,
    created_at
FROM tenants 
ORDER BY created_at DESC 
LIMIT 5;