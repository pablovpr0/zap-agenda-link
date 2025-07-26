-- Drop and recreate the public insert policy for clients to ensure it works correctly
DROP POLICY IF EXISTS "Inserir Cliente Público" ON public.clients;

-- Create a more explicit public insert policy
CREATE POLICY "Public can insert clients for bookings" 
ON public.clients 
FOR INSERT 
TO public
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;