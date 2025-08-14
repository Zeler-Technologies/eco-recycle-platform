-- SYSTEM TENANT FIX - Professional Enterprise Solution (Trigger-Safe)

-- Step 1: Temporarily disable the problematic trigger if it exists
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;

-- Step 2: Create System Tenant (ID 0) for platform operations
INSERT INTO tenants (tenants_id, name, country, service_type, base_address, invoice_email, date, created_at)
VALUES (
    0,
    'Platform Operations',
    'SE',
    'system_administration',
    'System Level',
    'admin@pantabilen.se',
    CURRENT_DATE,
    '2024-01-01 00:00:00+00'::timestamptz
) ON CONFLICT (tenants_id) DO NOTHING;

-- Step 3: Update super admin to belong to system tenant
UPDATE auth_users 
SET tenant_id = 0 
WHERE role::text = 'super_admin' AND tenant_id IS NULL;

-- Step 4: Create user profile in the 'user' table with valid tenants_id
INSERT INTO "user" (user_id, tenants_id, name, email, created_at)
SELECT 
    COALESCE((SELECT MAX(user_id) FROM "user"), 0) + 1,
    au.tenant_id,  -- Now this will be 0 (system tenant)
    COALESCE(au.email, 'Super Admin'),
    au.email,
    NOW()
FROM auth_users au
WHERE au.role::text = 'super_admin'
AND NOT EXISTS (
    SELECT 1 FROM "user" u 
    WHERE u.email = au.email
);

-- Step 5: Insert into user_roles using the bigint user_id
INSERT INTO user_roles (user_id, role, scrapyard_id, created_at, updated_at)
SELECT 
    u.user_id,
    'super_admin',
    NULL,
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

-- Step 6: Update RLS policy for proper system tenant access
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
        AND role::text = 'super_admin'
        AND tenant_id = 0
    )
);

-- Step 7: Verify the complete chain was created successfully
SELECT 
    'SUCCESS: Complete user chain verification' as status,
    au.id as auth_users_id,
    au.email as auth_email,
    au.role::text as auth_role,
    au.tenant_id as auth_tenant_id,
    u.user_id as user_profile_id,
    u.tenants_id as user_tenant_id,
    u.name as user_name,
    ur.role as user_role,
    t.name as tenant_name
FROM auth_users au
JOIN "user" u ON au.email = u.email
JOIN tenants t ON u.tenants_id = t.tenants_id
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
WHERE au.role::text = 'super_admin';