-- Create distance rules table for tenant-specific distance-based deductions
CREATE TABLE public.distance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  min_distance_km INTEGER NOT NULL,
  max_distance_km INTEGER,
  deduction_sek INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bonus offers table for tenant-specific bonus campaigns
CREATE TABLE public.bonus_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  bonus_name TEXT NOT NULL,
  bonus_amount_sek INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  conditions JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.distance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_offers ENABLE ROW LEVEL SECURITY;

-- Create policies for distance_rules
CREATE POLICY "Super admins can access all distance rules" 
ON public.distance_rules 
FOR ALL 
USING (( SELECT get_current_user_info.user_role
   FROM get_current_user_info() get_current_user_info(user_role, tenant_id)) = 'super_admin'::user_role);

CREATE POLICY "Tenant users can access distance rules in their tenant" 
ON public.distance_rules 
FOR ALL 
USING (tenant_id = ( SELECT get_current_user_info.tenant_id
   FROM get_current_user_info() get_current_user_info(user_role, tenant_id)));

-- Create policies for bonus_offers  
CREATE POLICY "Super admins can access all bonus offers" 
ON public.bonus_offers 
FOR ALL 
USING (( SELECT get_current_user_info.user_role
   FROM get_current_user_info() get_current_user_info(user_role, tenant_id)) = 'super_admin'::user_role);

CREATE POLICY "Tenant users can access bonus offers in their tenant" 
ON public.bonus_offers 
FOR ALL 
USING (tenant_id = ( SELECT get_current_user_info.tenant_id
   FROM get_current_user_info() get_current_user_info(user_role, tenant_id)));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_distance_rules_updated_at
  BEFORE UPDATE ON public.distance_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bonus_offers_updated_at
  BEFORE UPDATE ON public.bonus_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.distance_rules 
ADD CONSTRAINT distance_rules_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenants_id);

ALTER TABLE public.bonus_offers 
ADD CONSTRAINT bonus_offers_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenants_id);

-- Add validation constraints
ALTER TABLE public.distance_rules 
ADD CONSTRAINT distance_rules_valid_range 
CHECK (min_distance_km >= 0 AND (max_distance_km IS NULL OR max_distance_km > min_distance_km));

-- Create indexes for better performance
CREATE INDEX idx_distance_rules_tenant_id ON public.distance_rules(tenant_id);
CREATE INDEX idx_bonus_offers_tenant_id ON public.bonus_offers(tenant_id);
CREATE INDEX idx_bonus_offers_dates ON public.bonus_offers(tenant_id, start_date, end_date) WHERE is_active = true;