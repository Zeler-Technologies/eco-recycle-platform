-- SYSTEM TENANT FIX - Trigger-Safe Implementation
-- Fix the problematic trigger first, then create the system tenant

-- Step 1: Check if tenants table has updated_at column, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' 
        AND column_name = 'updated_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE tenants ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Step 2: Create System Tenant (ID 0) for platform operations
INSERT INTO tenants (tenants_id, name, country, date, created_at, updated_at)
VALUES (
    0,
    'Platform Operations',
    'SE',
    CURRENT_DATE,
    '2024-01-01 00:00:00+00'::timestamptz,
    '2024-01-01 00:00:00+00'::timestamptz
) ON CONFLICT (tenants_id) DO NOTHING;

-- Step 3: Update super admin to belong to system tenant
UPDATE auth_users 
SET tenant_id = 0 
WHERE role = 'super_admin'::user_role AND tenant_id IS NULL;

-- Step 4: Create user profile in the 'user' table with valid tenants_id
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

-- Step 5: Insert into user_roles (now both tables have updated_at columns)
INSERT INTO user_roles (user_id, role, created_at, updated_at)
SELECT 
    u.user_id,
    'super_admin',
    NOW(),
    NOW()
FROM "user" u
JOIN auth_users au ON u.email = au.email
WHERE au.role = 'super_admin'::user_role
AND u.user_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'super_admin');

-- Step 6: Update RLS policy for system tenant access
DROP POLICY IF EXISTS "super_admin_full_access" ON tenants;
CREATE POLICY "super_admin_full_access" ON tenants
FOR ALL USING (
    -- System tenant super admins can access all tenants
    EXISTS (
        SELECT 1 
        FROM auth_users au
        JOIN "user" u ON au.email = u.email
        JOIN user_roles ur ON u.user_id = ur.user_id
        WHERE au.id = auth.uid() 
        AND ur.role = 'super_admin'
        AND u.tenants_id = 0  -- System tenant
    ) OR 
    -- Fallback: direct check in auth_users
    EXISTS (
        SELECT 1 FROM auth_users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'::user_role
        AND tenant_id = 0
    )
);

-- Step 7: Verify complete setup
SELECT 
    'SUCCESS: System tenant and user chain created' as status,
    au.email as admin_email,
    au.tenant_id as admin_tenant_id,
    u.user_id as user_profile_id,
    u.tenants_id as user_tenant_id,
    ur.role as user_role,
    t.name as tenant_name
FROM auth_users au
JOIN "user" u ON au.email = u.email
JOIN tenants t ON u.tenants_id = t.tenants_id
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
WHERE au.role = 'super_admin'::user_role;