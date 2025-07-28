-- Fix ambiguous scrapyard_id column references in customer_requests RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert customer requests into their scrapyard" ON customer_requests;
DROP POLICY IF EXISTS "Users can update customer requests from their scrapyard" ON customer_requests;
DROP POLICY IF EXISTS "Users can view customer requests from their scrapyard" ON customer_requests;
DROP POLICY IF EXISTS "Users can delete customer requests from their scrapyard" ON customer_requests;

-- Create new policies with explicit column references and null handling
CREATE POLICY "Users can insert customer requests into their scrapyard" ON customer_requests
FOR INSERT
WITH CHECK (
  customer_requests.scrapyard_id IS NULL OR 
  (customer_requests.scrapyard_id IS NOT NULL AND is_super_admin()) OR 
  (customer_requests.scrapyard_id IS NOT NULL AND belongs_to_scrapyard(customer_requests.scrapyard_id))
);

CREATE POLICY "Users can update customer requests from their scrapyard" ON customer_requests
FOR UPDATE
USING (
  customer_requests.scrapyard_id IS NULL OR 
  (customer_requests.scrapyard_id IS NOT NULL AND is_super_admin()) OR 
  (customer_requests.scrapyard_id IS NOT NULL AND belongs_to_scrapyard(customer_requests.scrapyard_id))
)
WITH CHECK (
  customer_requests.scrapyard_id IS NULL OR 
  (customer_requests.scrapyard_id IS NOT NULL AND is_super_admin()) OR 
  (customer_requests.scrapyard_id IS NOT NULL AND belongs_to_scrapyard(customer_requests.scrapyard_id))
);

CREATE POLICY "Users can view customer requests from their scrapyard" ON customer_requests
FOR SELECT
USING (
  customer_requests.scrapyard_id IS NULL OR 
  (customer_requests.scrapyard_id IS NOT NULL AND is_super_admin()) OR 
  (customer_requests.scrapyard_id IS NOT NULL AND belongs_to_scrapyard(customer_requests.scrapyard_id))
);

CREATE POLICY "Users can delete customer requests from their scrapyard" ON customer_requests
FOR DELETE
USING (
  customer_requests.scrapyard_id IS NULL OR 
  (customer_requests.scrapyard_id IS NOT NULL AND is_super_admin()) OR 
  (customer_requests.scrapyard_id IS NOT NULL AND belongs_to_scrapyard(customer_requests.scrapyard_id))
);