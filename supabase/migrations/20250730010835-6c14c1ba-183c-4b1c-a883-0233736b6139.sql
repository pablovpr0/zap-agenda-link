
-- Remove todas as políticas problemáticas
DROP POLICY IF EXISTS "Public can view company profiles for booking" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Remove função problemática
DROP FUNCTION IF EXISTS public.get_companies_with_public_slug();

-- Cria função security definer correta
CREATE OR REPLACE FUNCTION public.get_public_company_ids()
RETURNS TABLE(company_id uuid)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT cs.company_id 
  FROM public.company_settings cs 
  WHERE cs.slug IS NOT NULL 
  AND cs.slug != '' 
  AND cs.status_aberto = true;
END;
$$;

-- Recria políticas corretas para profiles
CREATE POLICY "Users can manage own profile" 
ON public.profiles 
FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Public read for booking pages" 
ON public.profiles 
FOR SELECT 
USING (id IN (SELECT company_id FROM public.get_public_company_ids()));

-- Corrige política de company_settings para evitar conflitos
DROP POLICY IF EXISTS "Public can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Companies can manage their settings" ON public.company_settings;

CREATE POLICY "Companies manage own settings" 
ON public.company_settings 
FOR ALL 
USING (auth.uid() = company_id)
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Public read company settings" 
ON public.company_settings 
FOR SELECT 
USING (slug IS NOT NULL AND slug != '');

-- Corrige políticas de services
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
DROP POLICY IF EXISTS "Companies can manage their services" ON public.services;

CREATE POLICY "Companies manage own services" 
ON public.services 
FOR ALL 
USING (auth.uid() = company_id)
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Public read active services" 
ON public.services 
FOR SELECT 
USING (is_active = true);

-- Corrige políticas de professionals
DROP POLICY IF EXISTS "Public can view active professionals" ON public.professionals;
DROP POLICY IF EXISTS "Companies can manage their professionals" ON public.professionals;

CREATE POLICY "Companies manage own professionals" 
ON public.professionals 
FOR ALL 
USING (auth.uid() = company_id)
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Public read active professionals" 
ON public.professionals 
FOR SELECT 
USING (is_active = true);

-- Corrige políticas de appointments
DROP POLICY IF EXISTS "Companies can manage their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;

CREATE POLICY "Companies manage own appointments" 
ON public.appointments 
FOR ALL 
USING (auth.uid() = company_id)
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Public create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

-- Corrige políticas de clients
DROP POLICY IF EXISTS "Selecionar Cliente" ON public.clients;
DROP POLICY IF EXISTS "Atualizar Cliente" ON public.clients;
DROP POLICY IF EXISTS "Excluir Cliente" ON public.clients;
DROP POLICY IF EXISTS "Public can insert clients for bookings" ON public.clients;

CREATE POLICY "Companies manage own clients" 
ON public.clients 
FOR ALL 
USING (auth.uid() = company_id)
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Public create clients for booking" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

-- Garante que todas as tabelas tenham RLS habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Adiciona índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_company_settings_slug ON public.company_settings(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON public.company_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_services_company_active ON public.services(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_professionals_company_active ON public.professionals(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_company_date ON public.appointments(company_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);
