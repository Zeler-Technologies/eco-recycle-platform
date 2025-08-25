-- 1) Recreate unified view used across scheduling and driver apps
CREATE OR REPLACE VIEW public.v_pickup_status_unified AS
SELECT 
  po.id AS pickup_order_id,
  po.customer_request_id,
  po.tenant_id,
  -- unify driver assignment: prefer assigned_driver_id, fallback to driver_id
  COALESCE(po.assigned_driver_id, po.driver_id) AS driver_id,
  d.full_name AS driver_name,
  po.scheduled_pickup_date,
  po.actual_pickup_date,
  po.status AS pickup_status,
  po.driver_notes,
  po.completion_photos,
  po.created_at,
  po.updated_at,
  
  -- customer request details for UI
  cr.owner_name,
  cr.contact_phone,
  cr.pickup_address,
  cr.pickup_latitude,
  cr.pickup_longitude,
  cr.car_brand,
  cr.car_model,
  cr.car_year,
  cr.car_registration_number,
  
  -- additional useful fields
  cr.scrapyard_id,
  po.final_price,
  
  -- assignment status from driver_assignments table
  CASE 
    WHEN da.id IS NOT NULL AND da.is_active = true THEN da.status::text
    ELSE 'unassigned'
  END AS assignment_status,
  
  -- metadata from car_metadata if exists
  cm.kontrollsiffror,
  cm.part_list

FROM public.pickup_orders po
LEFT JOIN public.customer_requests cr ON cr.id = po.customer_request_id
LEFT JOIN public.drivers d ON d.id = COALESCE(po.assigned_driver_id, po.driver_id)
LEFT JOIN public.driver_assignments da ON da.pickup_order_id = po.id 
  AND da.is_active = true 
  AND da.completed_at IS NULL
  AND da.status NOT IN ('completed'::public.assignment_status, 'canceled'::public.assignment_status, 'failed'::public.assignment_status)
LEFT JOIN public.car_metadata cm ON cm.customer_request_id = cr.id;

GRANT SELECT ON public.v_pickup_status_unified TO authenticated;

-- 2) Optional enriched view preserved for backward compatibility
CREATE OR REPLACE VIEW public.v_pickup_orders_enriched AS
SELECT 
  po.*,
  cr.scrapyard_id,
  cr.owner_name,
  cr.contact_phone,
  cr.pickup_address,
  cr.car_brand,
  cr.car_model,
  cr.car_year,
  cr.car_registration_number,
  cr.pickup_latitude,
  cr.pickup_longitude,
  
  -- driver information
  d.full_name AS driver_name,
  d.phone_number AS driver_phone,
  d.vehicle_type AS driver_vehicle_type,
  
  -- assignment information
  da.status AS assignment_status,
  da.assigned_at,
  da.notes AS assignment_notes
  
FROM public.pickup_orders po
LEFT JOIN public.customer_requests cr ON cr.id = po.customer_request_id
LEFT JOIN public.drivers d ON d.id = COALESCE(po.assigned_driver_id, po.driver_id)
LEFT JOIN public.driver_assignments da ON da.pickup_order_id = po.id 
  AND da.is_active = true 
  AND da.completed_at IS NULL
  AND da.status NOT IN ('completed'::public.assignment_status, 'canceled'::public.assignment_status, 'failed'::public.assignment_status);

GRANT SELECT ON public.v_pickup_orders_enriched TO authenticated;

-- 3) Create a unified function for status updates that works with the view
CREATE OR REPLACE FUNCTION public.update_pickup_status_unified(
  p_pickup_order_id uuid,
  p_new_status text,
  p_driver_notes text DEFAULT NULL,
  p_completion_photos text[] DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_driver_id uuid;
  v_updated_count int;
BEGIN
  IF v_user IS NULL THEN 
    RAISE EXCEPTION 'Not authenticated'; 
  END IF;

  -- Get the driver ID for this pickup from the unified view
  SELECT driver_id INTO v_driver_id 
  FROM public.v_pickup_status_unified 
  WHERE pickup_order_id = p_pickup_order_id;
  
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Pickup order not found or no driver assigned';
  END IF;
  
  -- Verify the current user is the assigned driver
  IF NOT EXISTS (
    SELECT 1 FROM public.drivers 
    WHERE id = v_driver_id AND auth_user_id = v_user
  ) THEN
    RAISE EXCEPTION 'Not authorized to update this pickup order';
  END IF;
  
  -- Update the pickup order
  UPDATE public.pickup_orders
  SET 
    status = p_new_status,
    driver_notes = COALESCE(p_driver_notes, driver_notes),
    completion_photos = COALESCE(p_completion_photos, completion_photos),
    updated_at = now(),
    -- Set actual pickup date when status changes to completed
    actual_pickup_date = CASE 
      WHEN p_new_status = 'completed' THEN COALESCE(actual_pickup_date, CURRENT_DATE)
      ELSE actual_pickup_date
    END
  WHERE id = p_pickup_order_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Update the driver assignment status if it exists
  UPDATE public.driver_assignments
  SET 
    status = p_new_status::public.assignment_status,
    completed_at = CASE 
      WHEN p_new_status IN ('completed', 'canceled', 'failed') THEN now()
      ELSE completed_at
    END,
    is_active = CASE 
      WHEN p_new_status IN ('completed', 'canceled', 'failed') THEN false
      ELSE is_active
    END
  WHERE pickup_order_id = p_pickup_order_id 
    AND is_active = true;
  
  RETURN v_updated_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_pickup_status_unified(uuid, text, text, text[]) TO authenticated;

-- 4) Create indexes to optimize the unified views
CREATE INDEX IF NOT EXISTS idx_pickup_orders_assigned_driver 
  ON public.pickup_orders(assigned_driver_id) 
  WHERE assigned_driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pickup_orders_driver_id 
  ON public.pickup_orders(driver_id) 
  WHERE driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pickup_orders_tenant_status 
  ON public.pickup_orders(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_customer_requests_scrapyard 
  ON public.customer_requests(scrapyard_id);

-- 5) Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';