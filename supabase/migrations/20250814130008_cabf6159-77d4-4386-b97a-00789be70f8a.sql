-- SYSTEM TENANT FIX - Fix Trigger Function First
-- Replace the problematic trigger function with a safe one

-- Step 1: Create a safe trigger function that checks if column exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the table has an updated_at column before trying to update it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME 
        AND column_name = 'updated_at' 
        AND table_schema = TG_TABLE_SCHEMA
    ) THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Add updated_at column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: Create System Tenant (ID 0) for platform operations
INSERT INTO tenants (tenants_id, name, country, date, created_at, updated_at)
VALUES (
    0,
    'Platform Operations',
    'SE',
    CURRENT_DATE,
    '2024-01-01 00:00:00+00'::timestamptz,
    '2024-01-01 00:00:00+00'::timestamptz
) ON CONFLICT (tenants_id) DO NOTHING;

-- Step 4: Update super admin to belong to system tenant
UPDATE auth_users 
SET tenant_id = 0 
WHERE role = 'super_admin'::user_role AND tenant_id IS NULL;

-- Step 5: Create user profile with system tenant
INSERT INTO "user" (user_id, tenants_id, name, email, created_at)
SELECT 
    COALESCE((SELECT MAX(user_id) FROM "user"), 0) + 1,
    0,
    'Super Admin',
    au.email,
    NOW()
FROM auth_users au
WHERE au.role = 'super_admin'::user_role
AND NOT EXISTS (SELECT 1 FROM "user" u WHERE u.email = au.email);

-- Step 6: Add to user_roles
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

-- Step 7: Update RLS policy
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

-- Step 8: Verify success
SELECT 'SYSTEM TENANT CREATED!' as result, tenants_id, name FROM tenants WHERE tenants_id = 0;