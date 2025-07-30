
-- Criar trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, business_type)
  VALUES (NEW.id, NULL, NULL);
  RETURN NEW;
END;
$$;

-- Criar trigger que executa a função quando um usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualizar políticas RLS para melhor segurança
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política para permitir que usuários vejam perfis de empresas com slug público
DROP POLICY IF EXISTS "Public can view company profiles for booking" ON public.profiles;
CREATE POLICY "Public can view company profiles for booking"
ON public.profiles FOR SELECT
USING (
  id IN (
    SELECT company_id 
    FROM public.company_settings 
    WHERE slug IS NOT NULL AND slug != ''
  )
);

-- Garantir que company_settings seja criado automaticamente quando profile é criado
CREATE OR REPLACE FUNCTION public.create_company_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Criar configurações padrão quando um perfil é atualizado com company_name
  IF NEW.company_name IS NOT NULL AND NEW.company_name != '' AND OLD.company_name IS NULL THEN
    INSERT INTO public.company_settings (
      company_id,
      slug,
      working_days,
      working_hours_start,
      working_hours_end,
      appointment_interval,
      advance_booking_limit,
      monthly_appointments_limit
    ) VALUES (
      NEW.id,
      LOWER(REGEXP_REPLACE(NEW.company_name, '[^a-zA-Z0-9]', '-', 'g')),
      ARRAY[1,2,3,4,5],
      '09:00:00'::time,
      '18:00:00'::time,
      30,
      30,
      10
    ) ON CONFLICT (company_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_company_created ON public.profiles;
CREATE TRIGGER on_profile_company_created
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_company_settings();
