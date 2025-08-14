-- Insert some test tenants if they don't exist
INSERT INTO tenants (name, country, service_type, base_address, invoice_email, date) 
VALUES 
  ('PantaBilen Stockholm AB', 'Sverige', 'car_recycling', 'Industrivägen 15, 12345 Stockholm', 'faktura@stockholm.pantabilen.se', CURRENT_DATE),
  ('PantaBilen Göteborg AB', 'Sverige', 'car_recycling', 'Hamngatan 42, 41103 Göteborg', 'faktura@goteborg.pantabilen.se', CURRENT_DATE),
  ('Malmö Bilskrot AB', 'Sverige', 'car_recycling', 'Södra Förstadsgatan 101, 21115 Malmö', 'faktura@malmo.pantabilen.se', CURRENT_DATE)
ON CONFLICT (name) DO NOTHING;

-- Insert corresponding scrapyards
INSERT INTO scrapyards (tenant_id, name, address, postal_code, city, contact_person, contact_email, contact_phone, is_active)
SELECT 
  t.tenants_id,
  t.name || ' - Huvudkontor',
  split_part(t.base_address, ',', 1),
  split_part(split_part(t.base_address, ',', 2), ' ', 2),
  split_part(split_part(t.base_address, ',', 2), ' ', 3),
  'Admin',
  t.invoice_email,
  '+46701234567',
  true
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM scrapyards s WHERE s.tenant_id = t.tenants_id
);

-- Insert some test drivers
INSERT INTO drivers (tenant_id, full_name, phone_number, email, vehicle_type, driver_status, is_active)
SELECT 
  t.tenants_id,
  CASE 
    WHEN t.name LIKE '%Stockholm%' THEN 'Erik Andersson'
    WHEN t.name LIKE '%Göteborg%' THEN 'Anna Larsson'
    ELSE 'Mikael Johansson'
  END,
  '+46701234567',
  CASE 
    WHEN t.name LIKE '%Stockholm%' THEN 'erik@stockholm.pantabilen.se'
    WHEN t.name LIKE '%Göteborg%' THEN 'anna@goteborg.pantabilen.se'
    ELSE 'mikael@malmo.pantabilen.se'
  END,
  'Lastbil',
  'available',
  true
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM drivers d WHERE d.tenant_id = t.tenants_id
);

-- Insert some test customer requests
INSERT INTO customer_requests (tenant_id, owner_name, car_brand, car_model, car_registration_number, status, estimated_value, pickup_address)
SELECT 
  t.tenants_id,
  'Test Kund',
  'Volvo',
  'V70',
  'ABC' || t.tenants_id || '23',
  'pending',
  15000,
  'Testgatan 1, ' || split_part(split_part(t.base_address, ',', 2), ' ', 3)
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM customer_requests cr WHERE cr.tenant_id = t.tenants_id
);