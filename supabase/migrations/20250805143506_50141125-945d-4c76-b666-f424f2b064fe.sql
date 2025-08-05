-- Assign pickup orders to Mikaela Storm
UPDATE pickup_orders 
SET driver_id = 'de8d5462-582a-4bb7-a202-e45451fbb5e0',
    tenant_id = 1234,
    status = 'assigned'
WHERE driver_id IS NULL 
AND id IN (
    '4e54acdc-7e05-4d43-aaf5-33db9c15ae69',
    '1cc3e5d3-f6cb-4ec6-b541-bbaf8616084d', 
    '72306359-183c-4218-b01e-e671e393beab'
);

-- Fix the get_driver_pickups function to properly join with customer_requests
CREATE OR REPLACE FUNCTION get_driver_pickups(driver_auth_id uuid)
RETURNS TABLE(
  pickup_id uuid,
  customer_request_id uuid,
  car_registration_number text,
  car_brand text,
  car_model text,
  car_year integer,
  owner_name text,
  owner_address text,
  pickup_address text,
  pickup_postal_code text,
  pickup_latitude numeric,
  pickup_longitude numeric,
  status text,
  final_price numeric,
  driver_notes text,
  kontrollsiffror text,
  part_list jsonb,
  created_at timestamp with time zone,
  scheduled_pickup_time timestamp with time zone,
  completion_photos text[],
  pnr_num text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    po.id as pickup_id,
    po.customer_request_id,
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
    cr.control_number as kontrollsiffror,
    NULL::jsonb as part_list,
    po.created_at,
    po.scheduled_pickup_date as scheduled_pickup_time,
    po.completion_photos,
    cr.pnr_num
  FROM public.pickup_orders po
  JOIN public.drivers d ON d.id = po.driver_id
  JOIN public.customer_requests cr ON cr.id = po.customer_request_id
  WHERE d.auth_user_id = driver_auth_id
  AND d.is_active = true
  ORDER BY po.created_at DESC;
END;
$$;