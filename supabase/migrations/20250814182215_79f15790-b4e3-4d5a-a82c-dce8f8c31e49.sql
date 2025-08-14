-- Create auth users and link to drivers
DO $$
DECLARE
    erik_uuid UUID := '11111111-2222-3333-4444-555555555555';
    anna_uuid UUID := '66666666-7777-8888-9999-000000000000';
BEGIN
    -- Create auth_users records for our application tracking
    INSERT INTO auth_users (id, email, role, tenant_id) VALUES
    (erik_uuid, 'erik@pantabilen.se', 'driver'::user_role, 1),
    (anna_uuid, 'anna@pantabilen.se', 'driver'::user_role, 1)
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