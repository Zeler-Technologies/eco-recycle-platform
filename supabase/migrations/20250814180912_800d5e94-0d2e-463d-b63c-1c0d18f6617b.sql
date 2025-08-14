-- Simple fix for auth_user_id format without foreign key issues
-- Just update existing drivers to have NULL auth_user_id so they don't conflict

-- Clear invalid auth_user_ids (they'll be set when real users log in)
UPDATE drivers 
SET auth_user_id = NULL
WHERE auth_user_id IS NOT NULL 
   AND (length(auth_user_id::text) < 36 OR auth_user_id::text LIKE 'driver-%');

-- Clean up duplicate drivers to avoid conflicts
DELETE FROM drivers 
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id 
  FROM drivers 
  WHERE email IS NOT NULL
  ORDER BY email, created_at DESC
);

-- Show current driver status
SELECT 
    full_name,
    email,
    auth_user_id,
    CASE 
        WHEN auth_user_id IS NULL THEN '⚠️ No auth link (will be set on login)'
        WHEN length(auth_user_id::text) = 36 THEN '✅ Valid UUID'
        ELSE '❌ Invalid'
    END as status
FROM drivers 
WHERE is_active = true
ORDER BY full_name;