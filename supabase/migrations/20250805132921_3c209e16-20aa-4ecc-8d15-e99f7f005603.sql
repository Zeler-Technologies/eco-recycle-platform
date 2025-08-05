-- Create pickup orders for existing customer requests that don't have them
INSERT INTO public.pickup_orders (
  customer_request_id,
  status,
  final_price,
  driver_notes,
  scheduled_pickup_date,
  created_at
) 
SELECT 
  cr.id,
  CASE 
    WHEN cr.status = 'pending' THEN 'scheduled'
    WHEN cr.status = 'assigned' THEN 'assigned'
    WHEN cr.status = 'in_progress' THEN 'in_progress'
    WHEN cr.status = 'completed' THEN 'completed'
    ELSE 'scheduled'
  END,
  cr.quote_amount,
  'Automatiskt skapad från befintlig kundförfrågan',
  CASE 
    WHEN cr.status = 'completed' THEN cr.created_at::date + INTERVAL '1 day'
    ELSE CURRENT_DATE + INTERVAL '1 day'
  END,
  cr.created_at
FROM public.customer_requests cr
WHERE NOT EXISTS (
  SELECT 1 FROM public.pickup_orders po 
  WHERE po.customer_request_id = cr.id
);

-- Create driver assignments for the pickup orders we just created
-- Distribute them among available drivers
WITH available_drivers AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as driver_rank
  FROM public.drivers 
  WHERE is_active = true
),
new_pickup_orders AS (
  SELECT 
    po.id,
    po.created_at,
    ROW_NUMBER() OVER (ORDER BY po.created_at) as order_rank
  FROM public.pickup_orders po
  WHERE NOT EXISTS (
    SELECT 1 FROM public.driver_assignments da 
    WHERE da.pickup_order_id = po.id
  )
)
INSERT INTO public.driver_assignments (
  driver_id,
  pickup_order_id,
  customer_request_id,
  assignment_type,
  role,
  is_active,
  assigned_at
)
SELECT 
  ad.id,
  npo.id,
  po.customer_request_id,
  'pickup',
  'primary',
  true,
  npo.created_at
FROM new_pickup_orders npo
JOIN public.pickup_orders po ON po.id = npo.id
JOIN available_drivers ad ON ad.driver_rank = ((npo.order_rank - 1) % (SELECT COUNT(*) FROM available_drivers)) + 1;