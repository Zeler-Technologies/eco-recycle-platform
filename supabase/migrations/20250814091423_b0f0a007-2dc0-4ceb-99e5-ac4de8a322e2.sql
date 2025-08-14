-- Add enhanced columns to customer_requests table for Phase 1 improvements
ALTER TABLE customer_requests 
ADD COLUMN IF NOT EXISTS pickup_date DATE,
ADD COLUMN IF NOT EXISTS transport_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pickup_location TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'phone' CHECK (preferred_contact_method IN ('phone', 'email', 'sms'));

-- Update status column to include new statuses if not already present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                  WHERE constraint_name = 'customer_requests_status_check' 
                  AND table_name = 'customer_requests') THEN
        ALTER TABLE customer_requests 
        ADD CONSTRAINT customer_requests_status_check 
        CHECK (status IN ('pending', 'quoted', 'accepted', 'scheduled', 'completed', 'assigned', 'in_progress', 'cancelled'));
    END IF;
END$$;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_customer_requests_status ON customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_customer_requests_pickup_date ON customer_requests(pickup_date);
CREATE INDEX IF NOT EXISTS idx_customer_requests_created_at ON customer_requests(created_at);

-- Enhanced quote generation function with improved pricing logic
CREATE OR REPLACE FUNCTION generate_enhanced_quote(
  p_customer_request_id UUID,
  p_pickup_location TEXT DEFAULT NULL,
  p_preferred_date DATE DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request customer_requests%ROWTYPE;
  v_base_value INTEGER;
  v_transport_fee INTEGER := 0;
  v_member_bonus INTEGER := 0;
  v_final_quote INTEGER;
  v_pickup_date DATE;
  v_distance_km INTEGER := 0;
BEGIN
  -- Get customer request
  SELECT * INTO v_request FROM customer_requests WHERE id = p_customer_request_id;
  
  IF v_request.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Customer request not found');
  END IF;
  
  -- Enhanced pricing logic based on car metadata
  SELECT 
    CASE 
      WHEN v_request.car_year >= 2015 THEN 8000
      WHEN v_request.car_year >= 2010 THEN 6000
      WHEN v_request.car_year >= 2005 THEN 4000
      WHEN v_request.car_year >= 2000 THEN 3000
      ELSE 2000
    END +
    CASE 
      WHEN UPPER(v_request.car_brand) IN ('VOLVO', 'SAAB') THEN 1000
      WHEN UPPER(v_request.car_brand) IN ('BMW', 'MERCEDES', 'AUDI') THEN 1500
      WHEN UPPER(v_request.car_brand) IN ('TOYOTA', 'HONDA', 'NISSAN') THEN 800
      ELSE 500
    END
  INTO v_base_value;
  
  -- Calculate transport fee based on distance (simplified logic)
  IF p_pickup_location IS NOT NULL THEN
    -- Simplified distance calculation - in real implementation, use actual coordinates
    v_distance_km := (LENGTH(p_pickup_location) % 100) + 10; -- Mock calculation
    v_transport_fee := CASE 
      WHEN v_distance_km <= 20 THEN 0
      WHEN v_distance_km <= 50 THEN 500
      WHEN v_distance_km <= 100 THEN 1000
      ELSE 1500
    END;
  END IF;
  
  -- SBR member bonus (if applicable - simplified check)
  IF v_request.tenant_id IS NOT NULL THEN
    v_member_bonus := 500;
  END IF;
  
  -- Schedule pickup date (3-7 business days out)
  v_pickup_date := COALESCE(
    p_preferred_date, 
    CURRENT_DATE + INTERVAL '3 days' + 
    (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER % 2) * INTERVAL '2 days'
  );
  
  -- Ensure pickup date is not on weekend
  IF EXTRACT(DOW FROM v_pickup_date) IN (0, 6) THEN
    v_pickup_date := v_pickup_date + INTERVAL '2 days';
  END IF;
  
  v_final_quote := v_base_value + v_member_bonus - v_transport_fee;
  
  -- Ensure minimum quote value
  IF v_final_quote < 1000 THEN
    v_final_quote := 1000;
  END IF;
  
  -- Update request with quote details
  UPDATE customer_requests 
  SET 
    estimated_value = v_final_quote,
    pickup_date = v_pickup_date,
    transport_fee = v_transport_fee,
    pickup_location = COALESCE(pickup_location, p_pickup_location),
    status = 'quoted',
    updated_at = NOW()
  WHERE id = p_customer_request_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'baseValue', v_base_value,
    'memberBonus', v_member_bonus,
    'transportFee', v_transport_fee,
    'finalQuote', v_final_quote,
    'pickupDate', v_pickup_date,
    'estimatedDistance', v_distance_km,
    'requestId', p_customer_request_id,
    'carInfo', jsonb_build_object(
      'brand', v_request.car_brand,
      'model', v_request.car_model,
      'year', v_request.car_year,
      'registration', v_request.car_registration_number
    )
  );
END;
$$;