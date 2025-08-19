-- Add postal_code and city columns to tenants table to match TenantSetupForm
ALTER TABLE public.tenants 
ADD COLUMN postal_code TEXT,
ADD COLUMN city TEXT;