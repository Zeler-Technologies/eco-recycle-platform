-- Clean up function overloading by removing the 2-parameter version
DROP FUNCTION IF EXISTS update_pickup_status_unified(uuid, text, text);

-- Ensure we keep only the complete 4-parameter version
-- This should already exist from previous migrations
CREATE OR REPLACE FUNCTION update_pickup_status_unified(
  p_pickup_order_id uuid,
  p_new_status text,
  p_driver_notes text DEFAULT NULL,
  p_completion_photos text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status text;
  v_result jsonb;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status 
  FROM pickup_orders 
  WHERE id = p_pickup_order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pickup order not found'
    );
  END IF;
  
  -- Update pickup order
  UPDATE pickup_orders 
  SET 
    status = p_new_status,
    driver_notes = COALESCE(p_driver_notes, driver_notes),
    completion_photos = COALESCE(p_completion_photos, completion_photos),
    actual_pickup_date = CASE 
      WHEN p_new_status = 'completed' THEN COALESCE(actual_pickup_date, CURRENT_DATE)
      ELSE actual_pickup_date 
    END,
    updated_at = now()
  WHERE id = p_pickup_order_id;
  
  -- Log the status change
  INSERT INTO pickup_status_updates (
    pickup_order_id,
    old_status,
    new_status,
    driver_id,
    notes,
    photos
  ) VALUES (
    p_pickup_order_id,
    v_old_status,
    p_new_status,
    (SELECT assigned_driver_id FROM pickup_orders WHERE id = p_pickup_order_id),
    p_driver_notes,
    p_completion_photos
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'old_status', v_old_status,
    'new_status', p_new_status
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;