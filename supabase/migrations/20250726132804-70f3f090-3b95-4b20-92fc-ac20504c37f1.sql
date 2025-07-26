-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Public can view company profiles for booking" ON public.profiles;

-- Create a security definer function to safely query companies with slug
CREATE OR REPLACE FUNCTION public.get_companies_with_slug()
RETURNS TABLE(company_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT cs.company_id 
  FROM company_settings cs 
  WHERE cs.slug IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate the policy using the security definer function to avoid recursion
CREATE POLICY "Public can view company profiles for booking" 
ON public.profiles 
FOR SELECT 
USING (id IN (SELECT company_id FROM public.get_companies_with_slug()));