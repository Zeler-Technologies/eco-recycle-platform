-- Create user record in the 'user' table first
INSERT INTO "user" (tenants_id, name, email)
VALUES (1234, 'Mikaela Storm', 'mikaela@scrapyard.se');

-- Update the existing driver record to link it to the user (using user_id, not UUID)
UPDATE drivers 
SET auth_user_id = (
  SELECT user_id FROM "user" WHERE email = 'mikaela@scrapyard.se'
)::uuid
WHERE id = 'de8d5462-582a-4bb7-a202-e45451fbb5e0';