-- Create minimal test data for RLS verification
-- First ensure we have some scrapyards (without IDs to avoid conflicts)
INSERT INTO public.scrapyards (name, address, postal_code, city, tenant_id) VALUES
('Test Scrapyard Alpha', '123 Main St', '12345', 'Stockholm', 1),
('Test Scrapyard Beta', '456 Oak Ave', '67890', 'Göteborg', 2),
('Test Scrapyard Gamma', '789 Pine Rd', '11111', 'Malmö', 1);

-- Get the scrapyard IDs that were just created
WITH new_scrapyards AS (
  SELECT id, name FROM public.scrapyards 
  WHERE name IN ('Test Scrapyard Alpha', 'Test Scrapyard Beta', 'Test Scrapyard Gamma')
)
-- Create test tenant bidding data using the actual scrapyard IDs
INSERT INTO public.tenant_bidding (scrapyard_id, bid_amount, start_date, end_date, is_active, region_code)
SELECT 
  ns.id,
  CASE ns.name 
    WHEN 'Test Scrapyard Alpha' THEN 500.00
    WHEN 'Test Scrapyard Beta' THEN 750.00
    WHEN 'Test Scrapyard Gamma' THEN 300.00
  END as bid_amount,
  NOW() - INTERVAL '1 day' as start_date,
  NOW() + INTERVAL '30 days' as end_date,
  true as is_active,
  CASE ns.name 
    WHEN 'Test Scrapyard Alpha' THEN 'stockholm'
    WHEN 'Test Scrapyard Beta' THEN 'goteborg'
    WHEN 'Test Scrapyard Gamma' THEN 'stockholm'
  END as region_code
FROM new_scrapyards ns;