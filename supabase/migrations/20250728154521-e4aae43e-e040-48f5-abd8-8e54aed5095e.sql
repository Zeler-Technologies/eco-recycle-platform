-- Create test data for RLS verification
-- First create test scrapyards
INSERT INTO public.scrapyards (id, name, address, postal_code, city, tenant_id) VALUES
(1, 'Test Scrapyard 1', '123 Main St', '12345', 'Stockholm', 1),
(2, 'Test Scrapyard 2', '456 Oak Ave', '67890', 'Göteborg', 2),
(3, 'Test Scrapyard 3', '789 Pine Rd', '11111', 'Malmö', 1)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  postal_code = EXCLUDED.postal_code,
  city = EXCLUDED.city,
  tenant_id = EXCLUDED.tenant_id;

-- Create test users with different roles
INSERT INTO public.user_roles (id, user_id, scrapyard_id, role) VALUES
(1, '11111111-1111-1111-1111-111111111111', NULL, 'super_admin'),
(2, '22222222-2222-2222-2222-222222222222', 1, 'scrapyard_admin'),
(3, '33333333-3333-3333-3333-333333333333', 1, 'scrapyard_staff'),
(4, '44444444-4444-4444-4444-444444444444', 2, 'scrapyard_admin'),
(5, '55555555-5555-5555-5555-555555555555', 3, 'scrapyard_staff')
ON CONFLICT (id) DO UPDATE SET 
  user_id = EXCLUDED.user_id,
  scrapyard_id = EXCLUDED.scrapyard_id,
  role = EXCLUDED.role;

-- Create test tenant bidding data
INSERT INTO public.tenant_bidding (id, scrapyard_id, bid_amount, start_date, end_date, is_active, region_code) VALUES
(1, 1, 500.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true, 'stockholm'),
(2, 2, 750.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true, 'goteborg'),
(3, 3, 300.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true, 'stockholm'),
(4, 1, 600.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true, 'all'),
(5, 2, 400.00, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', false, 'goteborg') -- inactive bid
ON CONFLICT (id) DO UPDATE SET 
  scrapyard_id = EXCLUDED.scrapyard_id,
  bid_amount = EXCLUDED.bid_amount,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  is_active = EXCLUDED.is_active,
  region_code = EXCLUDED.region_code;