-- Insert some test tenants if they don't exist (without ON CONFLICT)
DO $$
BEGIN
  -- Insert test tenants
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE name = 'PantaBilen Stockholm AB') THEN
    INSERT INTO tenants (name, country, service_type, base_address, invoice_email, date) 
    VALUES ('PantaBilen Stockholm AB', 'Sverige', 'car_recycling', 'Industrivägen 15, 12345 Stockholm', 'faktura@stockholm.pantabilen.se', CURRENT_DATE);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM tenants WHERE name = 'PantaBilen Göteborg AB') THEN
    INSERT INTO tenants (name, country, service_type, base_address, invoice_email, date) 
    VALUES ('PantaBilen Göteborg AB', 'Sverige', 'car_recycling', 'Hamngatan 42, 41103 Göteborg', 'faktura@goteborg.pantabilen.se', CURRENT_DATE);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM tenants WHERE name = 'Malmö Bilskrot AB') THEN
    INSERT INTO tenants (name, country, service_type, base_address, invoice_email, date) 
    VALUES ('Malmö Bilskrot AB', 'Sverige', 'car_recycling', 'Södra Förstadsgatan 101, 21115 Malmö', 'faktura@malmo.pantabilen.se', CURRENT_DATE);
  END IF;
END $$;

-- Insert corresponding scrapyards
INSERT INTO scrapyards (tenant_id, name, address, postal_code, city, contact_person, contact_email, contact_phone, is_active)
SELECT 
  t.tenants_id,
  t.name || ' - Huvudkontor',
  'Industrivägen 15',
  '12345',
  CASE 
    WHEN t.name LIKE '%Stockholm%' THEN 'Stockholm'
    WHEN t.name LIKE '%Göteborg%' THEN 'Göteborg'
    ELSE 'Malmö'
  END,
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