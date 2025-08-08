-- Enable RLS on lookup tables and add policies
ALTER TABLE public.supported_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_timezones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for supported_currencies
CREATE POLICY "Allow public read access to supported currencies"
ON public.supported_currencies FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage all currencies"
ON public.supported_currencies FOR ALL
USING ((SELECT get_current_user_info.user_role FROM get_current_user_info() get_current_user_info(user_role, tenant_id)) = 'super_admin'::user_role);

-- Create policies for supported_timezones  
CREATE POLICY "Allow public read access to supported timezones"
ON public.supported_timezones FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage all timezones"
ON public.supported_timezones FOR ALL
USING ((SELECT get_current_user_info.user_role FROM get_current_user_info() get_current_user_info(user_role, tenant_id)) = 'super_admin'::user_role);

-- Create policies for supported_locales
CREATE POLICY "Allow public read access to supported locales"
ON public.supported_locales FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage all locales"
ON public.supported_locales FOR ALL
USING ((SELECT get_current_user_info.user_role FROM get_current_user_info() get_current_user_info(user_role, tenant_id)) = 'super_admin'::user_role);

-- Create policies for email_templates
CREATE POLICY "Allow public read access to email templates"
ON public.email_templates FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage all email templates"
ON public.email_templates FOR ALL
USING ((SELECT get_current_user_info.user_role FROM get_current_user_info() get_current_user_info(user_role, tenant_id)) = 'super_admin'::user_role);