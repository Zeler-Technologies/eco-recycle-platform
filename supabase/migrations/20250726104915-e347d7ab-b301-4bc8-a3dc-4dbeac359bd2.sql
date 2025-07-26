-- Check and remove the foreign key constraint that's causing the issue
ALTER TABLE public.customer_requests 
DROP CONSTRAINT IF EXISTS customer_requests_customer_id_fkey;

-- Make customer_id nullable since it's for anonymous users
ALTER TABLE public.customer_requests 
ALTER COLUMN customer_id DROP NOT NULL;