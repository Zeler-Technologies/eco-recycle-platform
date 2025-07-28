-- Add policy to allow everyone to view active scrapyards for customer selection
CREATE POLICY "Allow everyone to view active scrapyards" 
ON public.scrapyards 
FOR SELECT 
USING (is_active = true);