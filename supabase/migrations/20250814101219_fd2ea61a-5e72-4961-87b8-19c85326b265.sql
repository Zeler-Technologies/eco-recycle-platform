-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrapyards ENABLE ROW LEVEL SECURITY;

-- Create user_profiles table if not exists
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id INTEGER REFERENCES tenants(tenants_id),
  scrapyard_id INTEGER REFERENCES scrapyards(id),
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'driver' CHECK (role IN ('super_admin', 'tenant_admin', 'driver', 'customer')),
  phone_number TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create API usage logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER REFERENCES tenants(tenants_id),
  service_id UUID,
  endpoint TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  request_timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Super Admin: Can see everything
CREATE POLICY "super_admin_all_tenants" ON tenants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_all_drivers" ON drivers
  FOR ALL TO authenticated  
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_all_requests" ON customer_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_all_scrapyards" ON scrapyards
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Tenant Admin: Can only see their tenant's data
CREATE POLICY "tenant_admin_tenants" ON tenants
  FOR SELECT TO authenticated
  USING (
    tenants_id = (
      SELECT tenant_id FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('tenant_admin', 'driver')
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "tenant_admin_drivers" ON drivers
  FOR ALL TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('tenant_admin', 'driver')
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "tenant_admin_requests" ON customer_requests
  FOR ALL TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('tenant_admin', 'driver')
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "tenant_admin_scrapyards" ON scrapyards
  FOR ALL TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('tenant_admin', 'driver')
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Driver: Can see their own data and assigned requests
CREATE POLICY "driver_own_profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles up2
      WHERE up2.auth_user_id = auth.uid() 
      AND up2.role IN ('super_admin', 'tenant_admin')
      AND (up2.role = 'super_admin' OR up2.tenant_id = user_profiles.tenant_id)
    )
  );

CREATE POLICY "driver_assigned_requests" ON customer_requests  
  FOR SELECT TO authenticated
  USING (
    driver_id = auth.uid()
    OR tenant_id = (
      SELECT tenant_id FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('tenant_admin', 'driver')
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Customer: Public access for customer app
CREATE POLICY "public_customer_submit" ON customer_requests
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "public_customer_view_own" ON customer_requests
  FOR SELECT TO authenticated, anon
  USING (true);

-- User profiles policies
CREATE POLICY "user_profiles_manage" ON user_profiles
  FOR ALL TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles up2
      WHERE up2.auth_user_id = auth.uid() 
      AND up2.role IN ('super_admin', 'tenant_admin')
      AND (up2.role = 'super_admin' OR up2.tenant_id = user_profiles.tenant_id)
    )
  );

-- API usage logs policies
CREATE POLICY "api_usage_tenant_isolation" ON api_usage_logs  
  FOR ALL TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Function for driver assignment
CREATE OR REPLACE FUNCTION assign_driver_to_pickup(
  p_driver_id UUID,
  p_pickup_order_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if driver exists and is available
  IF NOT EXISTS (
    SELECT 1 FROM drivers 
    WHERE id = p_driver_id 
    AND driver_status = 'available' 
    AND is_active = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Driver not available');
  END IF;

  -- Update customer request
  UPDATE customer_requests 
  SET 
    driver_id = p_driver_id,
    status = 'assigned',
    pickup_date = now() + interval '2 hours',
    updated_at = now()
  WHERE id = p_pickup_order_id;

  -- Update driver status
  UPDATE drivers 
  SET 
    driver_status = 'busy',
    updated_at = now()
  WHERE id = p_driver_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function for finding nearby drivers
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  p_latitude DECIMAL,
  p_longitude DECIMAL, 
  p_radius_km INTEGER DEFAULT 50,
  p_tenant_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone_number TEXT,
  vehicle_type TEXT,
  driver_status TEXT,
  distance_km DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.full_name,
    d.phone_number,
    d.vehicle_type,
    d.driver_status,
    ROUND(
      (6371 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(COALESCE(d.current_latitude, 0))) * 
        cos(radians(COALESCE(d.current_longitude, 0)) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(COALESCE(d.current_latitude, 0)))
      ))::numeric, 2
    ) as distance_km
  FROM drivers d
  WHERE d.is_active = true
  AND d.driver_status = 'available'
  AND d.current_latitude IS NOT NULL
  AND d.current_longitude IS NOT NULL
  AND (p_tenant_id IS NULL OR d.tenant_id = p_tenant_id)
  AND (
    6371 * acos(
      cos(radians(p_latitude)) * 
      cos(radians(d.current_latitude)) * 
      cos(radians(d.current_longitude) - radians(p_longitude)) + 
      sin(radians(p_latitude)) * 
      sin(radians(d.current_latitude))
    )
  ) <= p_radius_km
  ORDER BY distance_km;
END;
$$;

-- Function for tenant creation
CREATE OR REPLACE FUNCTION create_tenant_complete(
  p_name TEXT,
  p_country TEXT,
  p_admin_name TEXT,
  p_admin_email TEXT,
  p_invoice_email TEXT DEFAULT NULL,
  p_service_type TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id INTEGER;
  v_scrapyard_id INTEGER;
  v_password TEXT;
  result JSON;
BEGIN
  -- Generate secure password
  v_password := substring(encode(gen_random_bytes(12), 'base64'), 1, 12);
  
  -- Create tenant
  INSERT INTO tenants (name, country, service_type, base_address, invoice_email, date)
  VALUES (p_name, p_country, p_service_type, 
          CONCAT_WS(', ', p_address, p_postal_code, p_city), 
          COALESCE(p_invoice_email, p_admin_email),
          CURRENT_DATE)
  RETURNING tenants_id INTO v_tenant_id;
  
  -- Create default scrapyard
  INSERT INTO scrapyards (tenant_id, name, address, postal_code, city, is_active)
  VALUES (v_tenant_id, p_name || ' - Huvudkontor', 
          COALESCE(p_address, 'Huvudkontor'), 
          p_postal_code, 
          COALESCE(p_city, 'Stockholm'), 
          true)
  RETURNING id INTO v_scrapyard_id;
  
  RETURN json_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'scrapyard_id', v_scrapyard_id,
    'admin_email', p_admin_email,
    'generated_password', v_password
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create update trigger for user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();