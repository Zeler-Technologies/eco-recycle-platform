-- Link mikaela@scrapyard.se auth user to Mikaela Storm driver record
UPDATE drivers 
SET auth_user_id = '91fd4af2-529f-4f2d-b657-b76c6307ff0c'
WHERE email = 'mikaela@scrapyard.se' 
  AND full_name = 'Mikaela Storm' 
  AND tenant_id = 1234;