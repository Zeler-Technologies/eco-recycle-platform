-- Drop and recreate get_driver_pickups with proper tenant/scrapyard filtering
DROP FUNCTION IF EXISTS public.get_driver_pickups(UUID);

CREATE OR REPLACE FUNCTION public.get_driver_pickups(driver_auth_id UUID)
RETURNS TABLE(
  pickup_id UUID,
  customer_request_id UUID,
  car_registration_number TEXT,
  car_brand TEXT,
  car_model TEXT,
  car_year INTEGER,
  owner_name TEXT,
  owner_address TEXT,
  pickup_address TEXT,
  pickup_postal_code TEXT,
  pickup_latitude NUMERIC,
  pickup_longitude NUMERIC,
  status TEXT,
  final_price NUMERIC,
  driver_notes TEXT,
  kontrollsiffror TEXT,
  part_list JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  scheduled_pickup_time DATE,
  completion_photos TEXT[],
  pnr_num TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    po.id as pickup_id,
    cr.id as customer_request_id,
    cr.car_registration_number,
    cr.car_brand,
    cr.car_model,
    cr.car_year,
    cr.owner_name,
    cr.owner_address,
    cr.pickup_address,
    cr.pickup_postal_code,
    cr.pickup_latitude,
    cr.pickup_longitude,
    po.status,
    po.final_price,
    po.driver_notes,
    cm.kontrollsiffror,
    cm.part_list,
    po.created_at,
    po.scheduled_pickup_date as scheduled_pickup_time,
    po.completion_photos,
    cr.pnr_num
  FROM public.pickup_orders po
  JOIN public.driver_assignments da ON po.id = da.pickup_order_id
  JOIN public.drivers d ON da.driver_id = d.id
  JOIN public.customer_requests cr ON po.customer_request_id = cr.id
  LEFT JOIN public.car_metadata cm ON cr.id = cm.customer_request_id
  WHERE d.auth_user_id = driver_auth_id
  AND da.is_active = true
  AND d.is_active = true
  -- Ensure driver only sees pickups for their tenant/scrapyard
  AND cr.tenant_id = d.tenant_id
  AND (d.scrapyard_id IS NULL OR cr.scrapyard_id = d.scrapyard_id)
  ORDER BY po.created_at DESC;
END;
$$;