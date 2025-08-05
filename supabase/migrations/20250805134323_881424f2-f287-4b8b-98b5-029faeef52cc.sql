-- Create auth user for Mikaela Storm and link to existing driver record
INSERT INTO auth_users (email, role, tenant_id, pnr_num)
VALUES ('mikaela@scrapyard.se', 'driver', 1234, '199012345678');

-- Update the existing driver record to link it to the auth user
UPDATE drivers 
SET auth_user_id = (
  SELECT id FROM auth_users WHERE email = 'mikaela@scrapyard.se'
)
WHERE id = 'de8d5462-582a-4bb7-a202-e45451fbb5e0';