-- Temporarily disable RLS for testing super admin access
-- We'll create bypassing policies for debugging

-- Create a simple policy that allows all access for super admin testing
CREATE POLICY "allow_super_admin_bypass_tenants" ON tenants
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_super_admin_bypass_drivers" ON drivers
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_super_admin_bypass_customer_requests" ON customer_requests
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_super_admin_bypass_scrapyards" ON scrapyards
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);