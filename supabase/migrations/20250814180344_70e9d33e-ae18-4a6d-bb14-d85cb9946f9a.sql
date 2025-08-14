-- Update driver records to link them with mock auth user IDs
-- This matches the IDs from the AuthContext mock data

-- Erik Andersson (erik@pantabilen.se -> driver-001)
UPDATE drivers 
SET auth_user_id = 'driver-001'
WHERE email = 'erik@stockholm.pantabilen.se' 
  AND full_name = 'Erik Andersson'
  AND auth_user_id IS NULL;

-- Anna Larsson/Johansson (anna@pantabilen.se -> driver-002)  
UPDATE drivers 
SET auth_user_id = 'driver-002'
WHERE email = 'anna@goteborg.pantabilen.se' 
  AND full_name = 'Anna Larsson'
  AND auth_user_id IS NULL;

-- Clean up duplicate drivers to avoid conflicts
-- Keep only one driver record per email
DELETE FROM drivers 
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id 
  FROM drivers 
  WHERE email IS NOT NULL
  ORDER BY email, created_at DESC
);

-- Ensure we have the test drivers if they don't exist
-- Erik
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
  'driver-001',
  'Erik Andersson',
  '+46 70 123 4567',
  'erik@pantabilen.se',
  'Lastbil',
  'ABC123',
  'available',
  1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM drivers WHERE auth_user_id = 'driver-001'
);

-- Anna  
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
  'driver-002',
  'Anna Johansson',
  '+46 70 234 5678',
  'anna@pantabilen.se',
  'Skåpbil',
  'XYZ789',
  'available',
  1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM drivers WHERE auth_user_id = 'driver-002'
);