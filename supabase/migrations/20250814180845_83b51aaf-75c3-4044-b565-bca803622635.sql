-- Fix driver auth_user_id format - use proper UUIDs instead of strings
-- This ensures compatibility with Supabase auth system

-- Update all drivers with invalid auth_user_id to use proper UUIDs
UPDATE drivers 
SET auth_user_id = gen_random_uuid()
WHERE auth_user_id IS NULL 
   OR length(auth_user_id::text) < 36
   OR auth_user_id::text LIKE 'driver-%';

-- Clean up duplicate drivers to avoid conflicts
-- Keep only one driver record per email
DELETE FROM drivers 
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id 
  FROM drivers 
  WHERE email IS NOT NULL
  ORDER BY email, created_at DESC
);

-- Ensure we have test drivers with proper UUID format
INSERT INTO drivers (
  id,
  auth_user_id,
  full_name,
  phone_number,
  email,
  vehicle_type,
  vehicle_registration,
  driver_status,
  tenant_id,
  is_active
) 
SELECT 
  gen_random_uuid(),
  gen_random_uuid(), -- Proper UUID for auth_user_id
  'Erik Andersson',
  '+46 70 123 4567',
  'erik@pantabilen.se',
  'Lastbil',
  'ABC123',
  'available',
  1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM drivers WHERE email = 'erik@pantabilen.se'
);

INSERT INTO drivers (
  id,
  auth_user_id,
  full_name,
  phone_number,
  email,
  vehicle_type,
  vehicle_registration,
  driver_status,
  tenant_id,
  is_active
) 
SELECT 
  gen_random_uuid(),
  gen_random_uuid(), -- Proper UUID for auth_user_id
  'Anna Johansson',
  '+46 70 234 5678',
  'anna@pantabilen.se',
  'Skåpbil',
  'XYZ789',
  'available',
  1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM drivers WHERE email = 'anna@pantabilen.se'
);

-- Verify the results
SELECT 
    full_name,
    email,
    auth_user_id,
    CASE 
        WHEN auth_user_id IS NOT NULL AND length(auth_user_id::text) = 36 
        THEN '✅ Valid UUID'
        ELSE '❌ Invalid'
    END as status
FROM drivers 
WHERE is_active = true
ORDER BY full_name;