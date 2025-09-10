-- Create pickup-photos storage bucket for driver verification photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pickup-photos', 'pickup-photos', true);

-- Create RLS policies for pickup-photos bucket

-- Allow public read access to pickup photos
CREATE POLICY "Pickup photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pickup-photos');

-- Allow authenticated users to upload pickup photos
CREATE POLICY "Authenticated users can upload pickup photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pickup-photos' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own pickup photos
CREATE POLICY "Authenticated users can update pickup photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pickup-photos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete pickup photos
CREATE POLICY "Authenticated users can delete pickup photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pickup-photos' AND auth.role() = 'authenticated');