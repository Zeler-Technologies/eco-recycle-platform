-- Create real Supabase auth users for testing
-- This will allow frontend authentication to work with real sessions

-- First, ensure we have the right structure in auth_users
UPDATE auth_users SET role = 'super_admin'::user_role WHERE id = '00000000-0000-0000-0000-000000000001';

-- Create additional test users in auth_users table
INSERT INTO auth_users (
  id,
  email,
  role,
  tenant_id,
  pnr_num,
  created_at,
  updated_at
) VALUES 
  -- Super Admin (already exists, just updating)
  ('00000000-0000-0000-0000-000000000001', 'admin@pantabilen.se', 'super_admin'::user_role, NULL, NULL, NOW(), NOW()),
  -- Tenant Admin - Stockholm
  ('11111111-1111-1111-1111-111111111111', 'admin@stockholm.pantabilen.se', 'tenant_admin'::user_role, 1, NULL, NOW(), NOW()),
  -- Tenant Admin - Göteborg  
  ('22222222-2222-2222-2222-222222222222', 'admin@goteborg.pantabilen.se', 'tenant_admin'::user_role, 2, NULL, NOW(), NOW()),
  -- Driver Erik
  ('33333333-3333-3333-3333-333333333333', 'erik@pantabilen.se', 'driver'::user_role, 1, NULL, NOW(), NOW()),
  -- Driver Anna
  ('44444444-4444-4444-4444-444444444444', 'anna@pantabilen.se', 'driver'::user_role, 1, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  tenant_id = EXCLUDED.tenant_id,
  updated_at = NOW();

-- Verify the users exist
SELECT 'AUTH USERS CREATED' as status, COUNT(*) as count FROM auth_users WHERE email LIKE '%pantabilen.se';