-- Enable RLS on scrapyards table
ALTER TABLE public.scrapyards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scrapyards table
CREATE POLICY "Super admins can access all scrapyards"
ON public.scrapyards
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.auth_users au 
    WHERE au.id = auth.uid() 
    AND au.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.auth_users au 
    WHERE au.id = auth.uid() 
    AND au.role = 'super_admin'
  )
);

CREATE POLICY "Tenant users can access scrapyards in their tenant"
ON public.scrapyards
FOR ALL
TO authenticated
USING (
  tenant_id = (
    SELECT au.tenant_id 
    FROM public.auth_users au 
    WHERE au.id = auth.uid()
  )
)
WITH CHECK (
  tenant_id = (
    SELECT au.tenant_id 
    FROM public.auth_users au 
    WHERE au.id = auth.uid()
  )
);