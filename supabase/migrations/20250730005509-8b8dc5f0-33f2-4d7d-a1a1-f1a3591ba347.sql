
-- Remove a política problemática que causa recursão
DROP POLICY IF EXISTS "Public can view company profiles for booking" ON public.profiles;

-- Cria função security definer para evitar recursão
CREATE OR REPLACE FUNCTION public.get_companies_with_public_slug()
RETURNS TABLE(company_id uuid)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT cs.company_id 
  FROM public.company_settings cs 
  WHERE cs.slug IS NOT NULL AND cs.slug != '';
END;
$$;

-- Recria a política usando a função security definer
CREATE POLICY "Public can view company profiles for booking" 
ON public.profiles 
FOR SELECT 
USING (id IN (SELECT company_id FROM public.get_companies_with_public_slug()));

-- Remove triggers conflitantes e cria um unificado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_company_settings_trigger ON public.profiles;

-- Remove funções antigas
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_company_settings();
DROP FUNCTION IF EXISTS public.generate_company_slug();

-- Cria função unificada para setup inicial do usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Cria perfil básico para o novo usuário
  INSERT INTO public.profiles (id, company_name, business_type)
  VALUES (NEW.id, NULL, NULL)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Cria trigger unificado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Corrige possíveis inconsistências de dados existentes
UPDATE public.profiles 
SET updated_at = now() 
WHERE updated_at IS NULL;
