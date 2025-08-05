-- PHASE 1.5: Create sample pickup orders and assignments for testing (Fixed)

-- First, create some customer requests with all required fields
INSERT INTO public.customer_requests (
  car_registration_number,
  car_brand,
  car_model,
  car_year,
  owner_name,
  owner_address,
  owner_postal_code,
  pickup_address,
  pickup_postal_code,
  pickup_latitude,
  pickup_longitude,
  status,
  tenant_id,
  pnr_num,
  created_at
) VALUES 
(
  'ABC123',
  'Volvo',
  'V70',
  2015,
  'Anna Andersson',
  'Storgatan 12, Stockholm',
  '11122',
  'Storgatan 12, Stockholm',
  '11122',
  59.3293,
  18.0686,
  'assigned',
  1,
  '9001011234',
  NOW() - INTERVAL '2 hours'
),
(
  'DEF456',
  'Saab',
  '9-3',
  2008,
  'Erik Eriksson',
  'Kungsgatan 25, Stockholm',
  '11124',
  'Kungsgatan 25, Stockholm',
  '11124',
  59.3345,
  18.0632,
  'assigned',
  1,
  '8505052345',
  NOW() - INTERVAL '1 hour'
),
(
  'GHI789',
  'BMW',
  '320i',
  2012,
  'Maria Karlsson',
  'Vasagatan 8, Stockholm',
  '11120',
  'Vasagatan 8, Stockholm',
  '11120',
  59.3301,
  18.0574,
  'assigned',
  1,
  '7712123456',
  NOW() - INTERVAL '30 minutes'
);

-- Create pickup orders for these customer requests
INSERT INTO public.pickup_orders (
  customer_request_id,
  status,
  final_price,
  driver_notes,
  scheduled_pickup_time,
  created_at
) 
SELECT 
  cr.id,
  'scheduled',
  15000 + (RANDOM() * 20000)::integer, -- Random price between 15000-35000
  'Redo för upphämtning',
  NOW() + INTERVAL '2 hours',
  cr.created_at
FROM public.customer_requests cr
WHERE cr.car_registration_number IN ('ABC123', 'DEF456', 'GHI789')
AND cr.created_at > NOW() - INTERVAL '3 hours'; -- Only recent ones we just created

-- Create driver assignments linking our demo driver to these pickup orders
INSERT INTO public.driver_assignments (
  driver_id,
  pickup_order_id,
  assignment_type,
  role,
  is_active,
  assigned_at
)
SELECT 
  '5dab13a6-d81a-4a22-8d13-e267250f2ca5', -- Our demo driver ID
  po.id,
  'pickup',
  'primary',
  true,
  NOW()
FROM public.pickup_orders po
JOIN public.customer_requests cr ON po.customer_request_id = cr.id
WHERE cr.car_registration_number IN ('ABC123', 'DEF456', 'GHI789')
AND cr.created_at > NOW() - INTERVAL '3 hours';