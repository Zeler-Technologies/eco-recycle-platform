-- Add transport_message template type support
-- Update the custom_message_templates table to support the new transport_message type
-- The table already exists, we just need to ensure it can handle the new template type

-- Insert a default transport message template for testing
INSERT INTO custom_message_templates (
  tenant_id,
  template_type,
  template_name,
  content,
  is_active
) VALUES (
  1, -- Replace with actual tenant ID
  'transport_message',
  'Standard transportmeddelande',
  'Lämna bilen på [basadress] och få [bonusbelopp] kr extra. (Är inkluderat i det pris du får. Gäller endast om bilen är komplett.)',
  true
) ON CONFLICT DO NOTHING;

-- Create edge function for Transportstyrelsen mock integration
-- This will be implemented in the edge function file