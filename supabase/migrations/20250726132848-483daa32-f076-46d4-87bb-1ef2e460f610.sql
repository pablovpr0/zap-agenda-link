-- Fix the security definer function by setting the search_path
CREATE OR REPLACE FUNCTION public.get_companies_with_slug()
RETURNS TABLE(company_id uuid) 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT cs.company_id 
  FROM public.company_settings cs 
  WHERE cs.slug IS NOT NULL;
END;
$$;