-- Create real auth users for Erik and Anna drivers
-- This approach properly creates auth users

-- First update drivers to clear auth_user_id for the test users we want to link
UPDATE drivers 
SET auth_user_id = NULL 
WHERE email IN ('erik@pantabilen.se', 'anna@pantabilen.se');

-- Create auth_users entries in our application table for role management
-- Note: Real user creation would happen via supabase.auth.signUp() in the frontend

-- For now, we'll create placeholder records that represent the auth users
-- In production, these would be linked when users actually sign up

-- Generate proper UUIDs for our test users
DO $$
DECLARE
    erik_uuid UUID := '11111111-2222-3333-4444-555555555555';
    anna_uuid UUID := '66666666-7777-8888-9999-000000000000';
BEGIN
    -- Create auth_users records for our application tracking
    INSERT INTO auth_users (id, email, role, tenant_id) VALUES
    (erik_uuid, 'erik@pantabilen.se', 'driver', 1),
    (anna_uuid, 'anna@pantabilen.se', 'driver', 1)
    ON CONFLICT (email) DO UPDATE SET
        id = EXCLUDED.id,
        role = EXCLUDED.role,
        tenant_id = EXCLUDED.tenant_id;

    -- Link drivers to these auth users
    UPDATE drivers 
    SET auth_user_id = erik_uuid
    WHERE email = 'erik@pantabilen.se';

    UPDATE drivers 
    SET auth_user_id = anna_uuid
    WHERE email = 'anna@pantabilen.se';
END $$;

-- Verify the setup
SELECT 
    d.full_name,
    d.email,
    d.auth_user_id,
    au.role,
    CASE 
        WHEN d.auth_user_id IS NOT NULL THEN '✅ Linked to auth user'
        ELSE '❌ No auth link'
    END as auth_status
FROM drivers d
LEFT JOIN auth_users au ON d.auth_user_id = au.id
WHERE d.email IN ('erik@pantabilen.se', 'anna@pantabilen.se')
ORDER BY d.full_name;