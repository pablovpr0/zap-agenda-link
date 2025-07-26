-- Create policy to allow public access to company profiles for booking
CREATE POLICY "Public can view company profiles for booking" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT company_id 
    FROM company_settings 
    WHERE slug IS NOT NULL
  )
);