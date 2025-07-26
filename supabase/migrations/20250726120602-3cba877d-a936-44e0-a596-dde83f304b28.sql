-- Remove the foreign key constraint that's causing the issue
-- car_metadata should reference customer_requests, not cars table
ALTER TABLE public.car_metadata DROP CONSTRAINT IF EXISTS car_metadata_car_id_fkey;

-- Rename the column to be more accurate since it's referencing customer_requests
ALTER TABLE public.car_metadata RENAME COLUMN car_id TO customer_request_id;