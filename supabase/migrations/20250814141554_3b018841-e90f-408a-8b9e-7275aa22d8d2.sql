-- PHASE 1: IMMEDIATE CRITICAL FIXES
-- 1.1 Create Safe Helper Functions to avoid RLS infinite recursion

-- Drop problematic existing functions if they exist
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

-- Create safe helper functions with SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS TEXT
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT role::text 
    FROM public.auth_users 
    WHERE id = auth.uid() 
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_super_admin_safe()
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'super_admin' 
     FROM public.auth_users 
     WHERE id = auth.uid() 
     LIMIT 1), 
    false
  );
END;
$$ LANGUAGE plpgsql;

-- Create helper function for tenant access
CREATE OR REPLACE FUNCTION public.get_user_tenant_id_safe()
RETURNS bigint
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM public.auth_users 
    WHERE id = auth.uid() 
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create RPC function to get accessible scrapyards without RLS issues
CREATE OR REPLACE FUNCTION public.get_accessible_scrapyards(p_tenant_id BIGINT DEFAULT NULL)
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  address TEXT,
  city TEXT,
  tenant_id BIGINT,
  is_active BOOLEAN
)
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Super admin sees all
  IF public.is_super_admin_safe() THEN
    RETURN QUERY
    SELECT s.id, s.name, s.address, s.city, s.tenant_id, s.is_active
    FROM public.scrapyards s
    WHERE s.is_active = true
    AND (p_tenant_id IS NULL OR s.tenant_id = p_tenant_id);
    
  -- Regular users see their tenant's scrapyards
  ELSE
    RETURN QUERY
    SELECT s.id, s.name, s.address, s.city, s.tenant_id, s.is_active
    FROM public.scrapyards s
    WHERE s.is_active = true
    AND s.tenant_id = COALESCE(
      p_tenant_id,
      public.get_user_tenant_id_safe()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Now drop ALL problematic RLS policies that cause recursion
DROP POLICY IF EXISTS "super_admin_full_access" ON public.tenants;
DROP POLICY IF EXISTS "super_admin_full_access_tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view own auth record" ON public.auth_users;
DROP POLICY IF EXISTS "Super admins can access all customers" ON public.customers;
DROP POLICY IF EXISTS "Tenant users can access customers in their tenant" ON public.customers;

-- Create simple, working RLS policies using safe functions
-- Tenants table policies
CREATE POLICY "tenants_safe_access" ON public.tenants
FOR ALL
TO authenticated
USING (
  public.is_super_admin_safe() = true OR
  tenants_id = public.get_user_tenant_id_safe()
)
WITH CHECK (
  public.is_super_admin_safe() = true OR
  tenants_id = public.get_user_tenant_id_safe()
);

-- Auth users table policies  
CREATE POLICY "auth_users_safe_access" ON public.auth_users
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_super_admin_safe() = true);

-- Customers table policies
CREATE POLICY "customers_safe_access" ON public.customers
FOR ALL
TO authenticated
USING (
  public.is_super_admin_safe() = true OR
  EXISTS (
    SELECT 1 FROM public.cars c 
    WHERE c.id = customers.car_id 
    AND c.tenant_id = public.get_user_tenant_id_safe()
  )
)
WITH CHECK (
  public.is_super_admin_safe() = true OR
  EXISTS (
    SELECT 1 FROM public.cars c 
    WHERE c.id = customers.car_id 
    AND c.tenant_id = public.get_user_tenant_id_safe()
  )
);

-- Scrapyards table policies
CREATE POLICY "scrapyards_safe_access" ON public.scrapyards
FOR ALL
TO authenticated
USING (
  public.is_super_admin_safe() = true OR
  tenant_id = public.get_user_tenant_id_safe()
)
WITH CHECK (
  public.is_super_admin_safe() = true OR
  tenant_id = public.get_user_tenant_id_safe()
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_customer_requests_tenant_id ON customer_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_requests_status ON customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_scrapyards_tenant_active ON scrapyards(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_auth_users_tenant_role ON auth_users(tenant_id, role);

-- Update character encoding issues in existing data
UPDATE scrapyards SET 
  name = REPLACE(REPLACE(REPLACE(name, 'Ã¥', 'å'), 'Ã¤', 'ä'), 'Ã¶', 'ö'),
  city = REPLACE(REPLACE(REPLACE(city, 'Ã¥', 'å'), 'Ã¤', 'ä'), 'Ã¶', 'ö'),
  address = REPLACE(REPLACE(REPLACE(address, 'Ã¥', 'å'), 'Ã¤', 'ä'), 'Ã¶', 'ö')
WHERE name LIKE '%Ã%' OR city LIKE '%Ã%' OR address LIKE '%Ã%';

UPDATE customer_requests SET 
  owner_name = REPLACE(REPLACE(REPLACE(owner_name, 'Ã¥', 'å'), 'Ã¤', 'ä'), 'Ã¶', 'ö'),
  pickup_address = REPLACE(REPLACE(REPLACE(pickup_address, 'Ã¥', 'å'), 'Ã¤', 'ä'), 'Ã¶', 'ö'),
  pickup_location = REPLACE(REPLACE(REPLACE(pickup_location, 'Ã¥', 'å'), 'Ã¤', 'ä'), 'Ã¶', 'ö')
WHERE owner_name LIKE '%Ã%' OR pickup_address LIKE '%Ã%' OR pickup_location LIKE '%Ã%';

UPDATE tenants SET 
  name = REPLACE(REPLACE(REPLACE(name, 'Ã¥', 'å'), 'Ã¤', 'ä'), 'Ã¶', 'ö'),
  base_address = REPLACE(REPLACE(REPLACE(base_address, 'Ã¥', 'å'), 'Ã¤', 'ä'), 'Ã¶', 'ö')
WHERE name LIKE '%Ã%' OR base_address LIKE '%Ã%';