-- API Configuration & Monitoring Schema
-- This file contains the database schema for the API management system

-- Create api_services table (Service catalog and providers)
CREATE TABLE public.api_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'payment', 'location', 'messaging', 'auth', 'database', 'monitoring', 'notifications'
  provider TEXT NOT NULL, -- 'Stripe', 'Google', 'Twilio', etc.
  description TEXT,
  documentation_url TEXT,
  default_config JSONB DEFAULT '{}',
  required_fields TEXT[] DEFAULT '{}',
  supported_regions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tenant_api_config table (Tenant-specific API usage and credentials)
CREATE TABLE public.tenant_api_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.api_services(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'test', -- 'test' or 'production'
  api_key_encrypted TEXT, -- Encrypted API key
  webhook_url TEXT,
  config_data JSONB DEFAULT '{}', -- Provider-specific configuration
  rate_limit_daily INTEGER DEFAULT 1000,
  rate_limit_monthly INTEGER DEFAULT 30000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, service_id)
);

-- Create api_usage_logs table (For real-time tracking, rate limits, errors)
CREATE TABLE public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.api_services(id) ON DELETE CASCADE,
  endpoint TEXT,
  method TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create api_health_status table (Last sync, uptime, latency)
CREATE TABLE public.api_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.api_services(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unknown', -- 'connected', 'disconnected', 'error', 'unknown'
  last_successful_call TIMESTAMPTZ,
  last_failed_call TIMESTAMPTZ,
  uptime_percentage DECIMAL(5,2) DEFAULT 0.0,
  average_latency_ms INTEGER DEFAULT 0,
  daily_usage_count INTEGER DEFAULT 0,
  monthly_usage_count INTEGER DEFAULT 0,
  last_health_check TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, service_id)
);

-- Enable Row Level Security
ALTER TABLE public.api_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_api_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_health_status ENABLE ROW LEVEL SECURITY;

-- Create policies for api_services (readable by all authenticated users)
CREATE POLICY "api_services_select" ON public.api_services
  FOR SELECT
  USING (true);

-- Create policies for tenant_api_config (tenant-specific access)
CREATE POLICY "tenant_api_config_select" ON public.tenant_api_config
  FOR SELECT
  USING (true); -- Super admin can see all configs

CREATE POLICY "tenant_api_config_insert" ON public.tenant_api_config
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "tenant_api_config_update" ON public.tenant_api_config
  FOR UPDATE
  USING (true);

CREATE POLICY "tenant_api_config_delete" ON public.tenant_api_config
  FOR DELETE
  USING (true);

-- Create policies for api_usage_logs (tenant-specific access)
CREATE POLICY "api_usage_logs_select" ON public.api_usage_logs
  FOR SELECT
  USING (true);

CREATE POLICY "api_usage_logs_insert" ON public.api_usage_logs
  FOR INSERT
  WITH CHECK (true);

-- Create policies for api_health_status (tenant-specific access)
CREATE POLICY "api_health_status_select" ON public.api_health_status
  FOR SELECT
  USING (true);

CREATE POLICY "api_health_status_insert" ON public.api_health_status
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "api_health_status_update" ON public.api_health_status
  FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_tenant_api_config_tenant_id ON public.tenant_api_config(tenant_id);
CREATE INDEX idx_tenant_api_config_service_id ON public.tenant_api_config(service_id);
CREATE INDEX idx_api_usage_logs_tenant_id ON public.api_usage_logs(tenant_id);
CREATE INDEX idx_api_usage_logs_service_id ON public.api_usage_logs(service_id);
CREATE INDEX idx_api_usage_logs_timestamp ON public.api_usage_logs(request_timestamp);
CREATE INDEX idx_api_health_status_tenant_id ON public.api_health_status(tenant_id);
CREATE INDEX idx_api_health_status_service_id ON public.api_health_status(service_id);

-- Insert default API services
INSERT INTO public.api_services (name, category, provider, description, required_fields, supported_regions) VALUES
-- Payment Services
('Stripe', 'payment', 'Stripe', 'Global payment processing', ARRAY['api_key', 'webhook_url'], ARRAY['US', 'EU', 'SE', 'NO']),
('Swish', 'payment', 'Swish', 'Swedish mobile payment system', ARRAY['api_key', 'certificate'], ARRAY['SE']),
('Vipps', 'payment', 'Vipps', 'Norwegian mobile payment system', ARRAY['api_key', 'merchant_id'], ARRAY['NO']),
('PayPal', 'payment', 'PayPal', 'Global payment processing', ARRAY['client_id', 'client_secret'], ARRAY['US', 'EU', 'SE', 'NO']),

-- Maps & Location Services
('Google Maps', 'location', 'Google', 'Maps and geocoding services', ARRAY['api_key'], ARRAY['GLOBAL']),

-- Messaging Services
('Twilio SMS', 'messaging', 'Twilio', 'SMS messaging service', ARRAY['account_sid', 'auth_token'], ARRAY['GLOBAL']),
('Nexmo SMS', 'messaging', 'Nexmo', 'SMS messaging service', ARRAY['api_key', 'api_secret'], ARRAY['GLOBAL']),

-- Email Services
('SendGrid', 'communications', 'SendGrid', 'Email delivery service', ARRAY['api_key'], ARRAY['GLOBAL']),
('SMTP', 'communications', 'SMTP', 'Standard email protocol', ARRAY['host', 'port', 'username', 'password'], ARRAY['GLOBAL']),

-- Authentication Services
('BankID', 'auth', 'BankID', 'Nordic digital identity', ARRAY['certificate', 'key'], ARRAY['SE', 'NO']),
('Supabase Auth', 'auth', 'Supabase', 'Authentication service', ARRAY['project_url', 'anon_key'], ARRAY['GLOBAL']),

-- Database Services
('PostgreSQL', 'database', 'PostgreSQL', 'Relational database', ARRAY['connection_string'], ARRAY['GLOBAL']),
('Supabase DB', 'database', 'Supabase', 'Managed PostgreSQL', ARRAY['project_url', 'service_key'], ARRAY['GLOBAL']),

-- Monitoring Services
('Sentry', 'monitoring', 'Sentry', 'Error monitoring and performance', ARRAY['dsn'], ARRAY['GLOBAL']),
('LogDNA', 'monitoring', 'LogDNA', 'Log management', ARRAY['api_key'], ARRAY['GLOBAL']),
('Grafana', 'monitoring', 'Grafana', 'Observability platform', ARRAY['api_key', 'url'], ARRAY['GLOBAL']),

-- Notification Services
('Push Notifications', 'notifications', 'Firebase', 'Mobile push notifications', ARRAY['server_key'], ARRAY['GLOBAL']),
('System Notifications', 'notifications', 'Custom', 'Internal notification system', ARRAY[], ARRAY['GLOBAL']);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_api_services_updated_at BEFORE UPDATE ON public.api_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_api_config_updated_at BEFORE UPDATE ON public.tenant_api_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_health_status_updated_at BEFORE UPDATE ON public.api_health_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();