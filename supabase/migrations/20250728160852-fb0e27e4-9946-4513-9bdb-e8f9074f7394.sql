-- Update existing scrapyards with proper coordinates
UPDATE public.scrapyards 
SET 
  latitude = 59.3293,  -- Stockholm coordinates
  longitude = 18.0686,
  contact_person = 'Erik Andersson',
  contact_email = 'erik@testscrapyard.se',
  contact_phone = '+46 8 123 456'
WHERE id = 1;

UPDATE public.scrapyards 
SET 
  latitude = 57.7089,  -- Göteborg coordinates  
  longitude = 11.9746,
  contact_person = 'Anna Lindberg',
  contact_email = 'anna@betascrap.se', 
  contact_phone = '+46 31 234 567'
WHERE id = 2;

UPDATE public.scrapyards 
SET 
  latitude = 55.6050,  -- Malmö coordinates
  longitude = 13.0038,
  contact_person = 'Lars Johansson',
  contact_email = 'lars@gammascrap.se',
  contact_phone = '+46 40 345 678'
WHERE id = 3;

-- Insert additional dummy scrapyards around Stockholm area with varied distances
INSERT INTO public.scrapyards (
  name, address, postal_code, city, 
  latitude, longitude, tenant_id,
  contact_person, contact_email, contact_phone,
  max_capacity, is_active
) VALUES 
-- Close to Stockholm (within 30km)
('Stockholm Bilskrot AB', 'Industrivägen 15', '17148', 'Solna', 
 59.3606, 18.0144, 1, 'Michael Berg', 'info@stockholmskrot.se', '+46 8 555 123', 15, true),

('Nordost Återvinning', 'Fabriksgatan 22', '18430', 'Åkersberga',
 59.4794, 18.3039, 2, 'Sara Nilsson', 'kontakt@nordost.se', '+46 8 555 234', 12, true),

('Södertälje Skrot & Metal', 'Metallvägen 8', '15142', 'Södertälje',
 59.1956, 17.6252, 1, 'Johan Petersson', 'info@sodertalje-skrot.se', '+46 8 555 345', 20, true),

-- Medium distance (30-60km)
('Uppsala Bilrecycling', 'Recyclingvägen 10', '75451', 'Uppsala',
 59.8586, 17.6389, 2, 'Emma Karlsson', 'service@uppsalarecycling.se', '+46 18 555 456', 18, true),

('Västerås Skrothandel', 'Skrotgatan 5', '72213', 'Västerås', 
 59.6162, 16.5528, 1, 'Nils Gustafsson', 'nils@vasterasskrot.se', '+46 21 555 567', 14, true),

-- Longer distance but still within reasonable range (60-100km)
('Norrköping Auto Recycling', 'Industriparken 12', '60221', 'Norrköping',
 58.5877, 16.1928, 2, 'Petra Månsson', 'info@norrkoping-auto.se', '+46 11 555 678', 16, true),

('Linköping Skrot AB', 'Återvinningsvägen 7', '58251', 'Linköping',
 58.4108, 15.6214, 1, 'Gustav Holm', 'gustav@linkopingskrot.se', '+46 13 555 789', 13, true);

-- Insert some tenant bidding data to make some scrapyards premium
INSERT INTO public.tenant_bidding (
  scrapyard_id, bid_amount, start_date, end_date, is_active, region_code
) VALUES 
(1, 25000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true, 'SE-01'),
(4, 30000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true, 'SE-01'),
(6, 22000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true, 'SE-01'),
(8, 28000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', true, 'SE-01');