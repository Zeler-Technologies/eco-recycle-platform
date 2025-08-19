-- First, let's create separate tenants for each scrapyard location
INSERT INTO public.tenants (name, country, date, service_type) VALUES
('Södertälje Skrot & Metal AB', 'Sverige', CURRENT_DATE, 'scrap_yard'),
('Västerås Skrothandel AB', 'Sverige', CURRENT_DATE, 'scrap_yard'),
('Uppsala Bilrecycling AB', 'Sverige', CURRENT_DATE, 'scrap_yard'), 
('Norrköping Auto Recycling AB', 'Sverige', CURRENT_DATE, 'scrap_yard'),
('Nordost Återvinning AB', 'Sverige', CURRENT_DATE, 'scrap_yard');

-- Now update the scrapyards to belong to their correct tenants
UPDATE public.scrapyards SET tenant_id = (SELECT tenants_id FROM public.tenants WHERE name = 'Södertälje Skrot & Metal AB' LIMIT 1)
WHERE name = 'Södertälje Skrot & Metal';

UPDATE public.scrapyards SET tenant_id = (SELECT tenants_id FROM public.tenants WHERE name = 'Västerås Skrothandel AB' LIMIT 1)
WHERE name = 'Västerås Skrothandel';

UPDATE public.scrapyards SET tenant_id = (SELECT tenants_id FROM public.tenants WHERE name = 'Uppsala Bilrecycling AB' LIMIT 1)
WHERE name = 'Uppsala Bilrecycling';

UPDATE public.scrapyards SET tenant_id = (SELECT tenants_id FROM public.tenants WHERE name = 'Norrköping Auto Recycling AB' LIMIT 1)
WHERE name = 'Norrköping Auto Recycling';

UPDATE public.scrapyards SET tenant_id = (SELECT tenants_id FROM public.tenants WHERE name = 'Nordost Återvinning AB' LIMIT 1)
WHERE name = 'Nordost Återvinning';

-- Keep only Stockholm-based scrapyards for Demo Scrapyard Stockholm (tenant_id = 1)
-- The following will remain with Demo Scrapyard Stockholm:
-- - Test Scrapyard Alpha (Stockholm)
-- - Test Scrapyard Beta (can be Stockholm area)  
-- - Test Scrapyard Gamma (can be Stockholm area)
-- - Stockholm Bilskrot AB (Stockholm area - Solna)
-- - Linköping Skrot AB (can be moved to separate tenant too)

UPDATE public.scrapyards SET tenant_id = (SELECT tenants_id FROM public.tenants WHERE name = 'Uppsala Bilrecycling AB' LIMIT 1)
WHERE name = 'Linköping Skrot AB';