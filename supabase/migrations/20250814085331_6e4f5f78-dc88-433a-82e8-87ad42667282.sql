-- Add missing RPC function for driver assignment
CREATE OR REPLACE FUNCTION list_available_pickup_requests(
  p_driver_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  pickup_order_id UUID,
  customer_request_id UUID,
  owner_name TEXT,
  pickup_address TEXT,
  car_brand TEXT,
  car_model TEXT,
  status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id as pickup_order_id,
    cr.id as customer_request_id,
    cr.owner_name,
    cr.pickup_address,
    cr.car_brand,
    cr.car_model,
    cr.status
  FROM customer_requests cr
  WHERE cr.status IN ('pending', 'approved')
  AND NOT EXISTS (
    SELECT 1 FROM driver_assignments da 
    WHERE da.customer_request_id = cr.id 
    AND da.is_active = true
  )
  ORDER BY cr.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Add RPC function for driver assignment
CREATE OR REPLACE FUNCTION assign_driver_to_pickup(
  p_driver_id UUID,
  p_pickup_order_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_id UUID;
  v_result jsonb;
BEGIN
  -- Insert new assignment
  INSERT INTO driver_assignments (
    driver_id,
    customer_request_id,
    pickup_order_id,
    role,
    notes,
    status,
    is_active
  ) VALUES (
    p_driver_id,
    p_pickup_order_id, -- using as customer_request_id too for now
    p_pickup_order_id,
    'primary',
    p_notes,
    'assigned',
    true
  ) RETURNING id INTO v_assignment_id;
  
  -- Update customer request status
  UPDATE customer_requests 
  SET status = 'assigned',
      updated_at = now()
  WHERE id = p_pickup_order_id;
  
  v_result := jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'message', 'Driver assigned successfully'
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;