-- Create auth users and link to drivers with proper pnr_num
DO $$
DECLARE
    erik_uuid UUID := '11111111-2222-3333-4444-555555555555';
    anna_uuid UUID := '66666666-7777-8888-9999-000000000000';
BEGIN
    -- Create auth_users records for our application tracking
    -- Using valid Swedish personal number format (test numbers)
    INSERT INTO auth_users (id, email, role, tenant_id, pnr_num, pnr_num_norm) VALUES
    (erik_uuid, 'erik@pantabilen.se', 'driver'::user_role, 1, '8501011234', '8501011234'),
    (anna_uuid, 'anna@pantabilen.se', 'driver'::user_role, 1, '9002021234', '9002021234')
    ON CONFLICT (email) DO UPDATE SET
        id = EXCLUDED.id,
        role = EXCLUDED.role,
        tenant_id = EXCLUDED.tenant_id,
        pnr_num = EXCLUDED.pnr_num,
        pnr_num_norm = EXCLUDED.pnr_num_norm;

    -- Link drivers to these auth users
    UPDATE drivers 
    SET auth_user_id = erik_uuid
    WHERE email = 'erik@pantabilen.se';

    UPDATE drivers 
    SET auth_user_id = anna_uuid
    WHERE email = 'anna@pantabilen.se';
END $$;