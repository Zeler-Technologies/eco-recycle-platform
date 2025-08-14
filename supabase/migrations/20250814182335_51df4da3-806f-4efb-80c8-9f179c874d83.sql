-- Create auth users and link to drivers with proper pnr_num (auto-generated norm)
DO $$
DECLARE
    erik_uuid UUID := '11111111-2222-3333-4444-555555555555';
    anna_uuid UUID := '66666666-7777-8888-9999-000000000000';
BEGIN
    -- Create auth_users records for our application tracking
    -- Using valid Swedish personal number format (test numbers)
    INSERT INTO auth_users (id, email, role, tenant_id, pnr_num) VALUES
    (erik_uuid, 'erik@pantabilen.se', 'driver'::user_role, 1, '8501011234'),
    (anna_uuid, 'anna@pantabilen.se', 'driver'::user_role, 1, '9002021234')
    ON CONFLICT (email) DO UPDATE SET
        id = EXCLUDED.id,
        role = EXCLUDED.role,
        tenant_id = EXCLUDED.tenant_id,
        pnr_num = EXCLUDED.pnr_num;

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