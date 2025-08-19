-- Enable RLS on scrapyards table if not already enabled
ALTER TABLE public.scrapyards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them properly
DROP POLICY IF EXISTS "Super admins can access all scrapyards" ON public.scrapyards;
DROP POLICY IF EXISTS "Tenant users can access scrapyards in their tenant" ON public.scrapyards;
DROP POLICY IF EXISTS "temp_scrapyards_select" ON public.scrapyards;

-- Create proper RLS policies for scrapyards
CREATE POLICY "Super admins can access all scrapyards" 
ON public.scrapyards 
FOR ALL 
USING (
  (SELECT get_current_user_info.user_role FROM get_current_user_info() get_current_user_info(user_role, tenant_id)) = 'super_admin'::user_role
);

CREATE POLICY "Tenant users can only access their own tenant scrapyards" 
ON public.scrapyards 
FOR SELECT 
USING (
  tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info() get_current_user_info(user_role, tenant_id))
);

-- Add insert/update policies for tenant users
CREATE POLICY "Tenant users can manage scrapyards in their tenant" 
ON public.scrapyards 
FOR INSERT 
WITH CHECK (
  tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info() get_current_user_info(user_role, tenant_id))
);

CREATE POLICY "Tenant users can update scrapyards in their tenant" 
ON public.scrapyards 
FOR UPDATE 
USING (
  tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info() get_current_user_info(user_role, tenant_id))
)
WITH CHECK (
  tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info() get_current_user_info(user_role, tenant_id))
);