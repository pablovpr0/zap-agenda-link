-- Remove the previous public client policy and add the new unrestricted one
DROP POLICY IF EXISTS "Public can create clients for companies with booking enabled" ON public.clients;

-- Ensure RLS is enabled on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Add the new public insert policy as requested
CREATE POLICY "Inserir Cliente Público" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);