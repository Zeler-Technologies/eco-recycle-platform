-- Create SMS trigger rules table for automation
CREATE TABLE IF NOT EXISTS public.sms_trigger_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id BIGINT NOT NULL,
  trigger_event TEXT NOT NULL,
  template_id UUID REFERENCES public.custom_message_templates(id),
  delay_minutes INTEGER DEFAULT 0,
  trigger_sequence INTEGER DEFAULT 1,
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_trigger_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Tenant users can manage their trigger rules" 
ON public.sms_trigger_rules 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.auth_users 
    WHERE id = auth.uid() 
    AND tenant_id = sms_trigger_rules.tenant_id
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sms_trigger_rules_tenant_event 
ON public.sms_trigger_rules(tenant_id, trigger_event, is_enabled);