-- Create real Supabase Auth users and link them to drivers
-- Note: In a real scenario, users would sign up through the UI
-- This migration creates the users directly for testing purposes

-- First, let's create the auth users (this simulates what would happen during real signup)
-- In production, these would be created via supabase.auth.signUp()

-- For testing, we'll insert directly into auth.users (normally done by Supabase Auth)
-- This is only for development/testing purposes

-- Create auth users for Erik and Anna
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES
-- Erik Andersson
('00000000-0000-0000-0000-000000000000', 
 '11111111-2222-3333-4444-555555555555',
 'authenticated', 
 'authenticated',
 'erik@pantabilen.se',
 crypt('SecurePass123!', gen_salt('bf')),
 now(),
 now(),
 now(),
 '',
 '',
 '',
 ''
),
-- Anna Johansson  
('00000000-0000-0000-0000-000000000000',
 '66666666-7777-8888-9999-000000000000', 
 'authenticated',
 'authenticated', 
 'anna@pantabilen.se',
 crypt('SecurePass123!', gen_salt('bf')),
 now(),
 now(), 
 now(),
 '',
 '',
 '',
 ''
)
ON CONFLICT (email) DO NOTHING;

-- Now update the drivers table to link to these real auth users
UPDATE drivers 
SET auth_user_id = '11111111-2222-3333-4444-555555555555'
WHERE email = 'erik@pantabilen.se';

UPDATE drivers 
SET auth_user_id = '66666666-7777-8888-9999-000000000000'
WHERE email = 'anna@pantabilen.se';

-- Verify the connections
SELECT 
    d.full_name,
    d.email,
    d.auth_user_id,
    CASE 
        WHEN d.auth_user_id IS NOT NULL THEN '✅ Linked to auth user'
        ELSE '❌ No auth link'
    END as auth_status
FROM drivers d
WHERE d.email IN ('erik@pantabilen.se', 'anna@pantabilen.se')
ORDER BY d.full_name;