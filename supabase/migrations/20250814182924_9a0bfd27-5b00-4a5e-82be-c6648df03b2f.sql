-- Create actual Supabase Auth users for Erik and Anna
-- Note: These will be created with the UUIDs we already have in auth_users table

-- First, let's update the auth_users table to use the correct UUIDs from Supabase Auth
-- We'll create the users via the edge function call, then link them properly

-- For now, let's create a function to handle test user creation
CREATE OR REPLACE FUNCTION create_test_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    erik_uuid uuid;
    anna_uuid uuid;
BEGIN
    -- These should match the UUIDs we have in auth_users
    SELECT id INTO erik_uuid FROM auth_users WHERE email = 'erik@pantabilen.se';
    SELECT id INTO anna_uuid FROM auth_users WHERE email = 'anna@pantabilen.se';
    
    -- Log what we found
    RAISE NOTICE 'Erik UUID: %', erik_uuid;
    RAISE NOTICE 'Anna UUID: %', anna_uuid;
    
    -- Update drivers table to use correct auth_user_id
    UPDATE drivers 
    SET auth_user_id = erik_uuid 
    WHERE full_name = 'Erik Andersson' AND auth_user_id IS NULL;
    
    UPDATE drivers 
    SET auth_user_id = anna_uuid 
    WHERE full_name = 'Anna Johansson' AND auth_user_id IS NULL;
    
    RAISE NOTICE 'Test users setup completed';
END;
$$;

-- Execute the function
SELECT create_test_auth_users();