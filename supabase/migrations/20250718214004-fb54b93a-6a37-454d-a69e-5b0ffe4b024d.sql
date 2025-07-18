-- Create custom message templates table
CREATE TABLE public.custom_message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('initial_owner', 'initial_non_owner', 'pickup_confirmed')),
  template_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, template_type)
);

-- Enable RLS
ALTER TABLE public.custom_message_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY "Super admins can access all custom message templates" 
ON public.custom_message_templates 
FOR ALL 
USING ((SELECT get_current_user_info.user_role FROM get_current_user_info() get_current_user_info(user_role, tenant_id)) = 'super_admin'::user_role);

CREATE POLICY "Tenant users can access custom message templates in their tenant" 
ON public.custom_message_templates 
FOR ALL 
USING (tenant_id = (SELECT get_current_user_info.tenant_id FROM get_current_user_info() get_current_user_info(user_role, tenant_id)));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_message_templates_updated_at
BEFORE UPDATE ON public.custom_message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates for the existing tenant
INSERT INTO public.custom_message_templates (tenant_id, template_type, template_name, content) VALUES
(1234, 'initial_owner', 'Initial Pickup Request - Car Owner', 'Hej [namn], tack för att du använder Panta Bilen. Vi har registrerat din begäran om upphämtning av fordonet med registreringsnummer [registreringsnummer] och kontrollnummer [kontrollnummer]. Vi återkommer snart med bekräftelse från bilskroten.'),
(1234, 'initial_non_owner', 'Initial Pickup Request - Not Car Owner', 'Hej [namn], bilskroten [scrapyard_name] kommer ta kontakt med dig inom kort. Eftersom du inte äger fordonet måste en fullmakt lämnas i anmälan att du får skrota fordonet med ägarens tillstånd.'),
(1234, 'pickup_confirmed', 'Pickup Confirmation', 'Hej [namn], vi bekräftar härmed att vi hämtar din bil med reg nr [registreringsnummer] den [datum]. Var god ha bilen färdig för upphämtning.');