-- Add RLS policy to allow public client creation for companies with booking enabled
CREATE POLICY "Public can create clients for companies with booking enabled" 
ON public.clients 
FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM get_companies_with_slug()));