-- Create master postal codes table for centralized management
CREATE TABLE public.postal_codes_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT,
  country TEXT NOT NULL DEFAULT 'Sweden',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(postal_code, country)
);

-- Create tenant coverage areas table
CREATE TABLE public.tenant_coverage_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id BIGINT NOT NULL REFERENCES tenants(tenants_id) ON DELETE CASCADE,
  postal_code_id UUID REFERENCES postal_codes_master(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, postal_code_id)
);

-- Enable RLS for multi-tenant isolation
ALTER TABLE public.postal_codes_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_coverage_areas ENABLE ROW LEVEL SECURITY;

-- Super Admin can manage all postal codes
CREATE POLICY "Super admin full access postal codes" ON public.postal_codes_master 
FOR ALL TO authenticated 
USING (
  EXISTS (SELECT 1 FROM auth_users WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM auth_users WHERE id = auth.uid() AND role = 'super_admin')
);

-- Tenants can view postal codes for their country
CREATE POLICY "Tenants view postal codes" ON public.postal_codes_master 
FOR SELECT TO authenticated 
USING (
  country = (
    SELECT t.country 
    FROM tenants t 
    JOIN auth_users au ON au.tenant_id = t.tenants_id 
    WHERE au.id = auth.uid()
  )
);

-- Super admin can view all coverage areas
CREATE POLICY "Super admin view all coverage" ON public.tenant_coverage_areas 
FOR SELECT TO authenticated 
USING (
  EXISTS (SELECT 1 FROM auth_users WHERE id = auth.uid() AND role = 'super_admin')
);

-- Tenants can manage their own coverage areas
CREATE POLICY "Tenants manage coverage" ON public.tenant_coverage_areas 
FOR ALL TO authenticated 
USING (
  tenant_id = (SELECT tenant_id FROM auth_users WHERE id = auth.uid())
)
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM auth_users WHERE id = auth.uid())
);

-- Create indexes for performance
CREATE INDEX idx_postal_codes_country ON postal_codes_master(country);
CREATE INDEX idx_postal_codes_code ON postal_codes_master(postal_code);
CREATE INDEX idx_coverage_tenant ON tenant_coverage_areas(tenant_id);
CREATE INDEX idx_coverage_postal ON tenant_coverage_areas(postal_code_id);

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_postal_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_postal_codes_master_updated_at
    BEFORE UPDATE ON postal_codes_master
    FOR EACH ROW
    EXECUTE FUNCTION update_postal_codes_updated_at();

CREATE TRIGGER update_tenant_coverage_updated_at
    BEFORE UPDATE ON tenant_coverage_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_postal_codes_updated_at();