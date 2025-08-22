-- Update the non-standard status to a proper one
UPDATE customer_requests 
SET status = 'pending', 
    updated_at = now()
WHERE status = 'Bekräftad';

-- Check if there's a status constraint and add one if needed
-- First check current constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'customer_requests'::regclass 
  AND contype = 'c';