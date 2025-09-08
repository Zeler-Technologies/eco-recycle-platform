-- Add RLS policies for scrapyard_invoices table
CREATE POLICY "Super admins can access all invoices" 
ON public.scrapyard_invoices 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Tenant admins can manage invoices in their tenant" 
ON public.scrapyard_invoices 
FOR ALL 
TO authenticated 
USING (
  tenant_id IN (
    SELECT s.tenant_id 
    FROM public.scrapyards s
    JOIN public.user_roles ur ON ur.scrapyard_id = s.id
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('scrapyard_admin', 'tenant_admin')
  )
) 
WITH CHECK (
  tenant_id IN (
    SELECT s.tenant_id 
    FROM public.scrapyards s
    JOIN public.user_roles ur ON ur.scrapyard_id = s.id
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('scrapyard_admin', 'tenant_admin')
  )
);

-- Add RLS policies for scrapyard_invoice_items table
CREATE POLICY "Super admins can access all invoice items" 
ON public.scrapyard_invoice_items 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Tenant admins can manage invoice items in their tenant" 
ON public.scrapyard_invoice_items 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.scrapyard_invoices si
    JOIN public.scrapyards s ON si.scrapyard_id = s.id
    JOIN public.user_roles ur ON ur.scrapyard_id = s.id
    WHERE si.id = scrapyard_invoice_items.invoice_id
    AND ur.user_id = auth.uid() 
    AND ur.role IN ('scrapyard_admin', 'tenant_admin')
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scrapyard_invoices si
    JOIN public.scrapyards s ON si.scrapyard_id = s.id
    JOIN public.user_roles ur ON ur.scrapyard_id = s.id
    WHERE si.id = scrapyard_invoice_items.invoice_id
    AND ur.user_id = auth.uid() 
    AND ur.role IN ('scrapyard_admin', 'tenant_admin')
  )
);