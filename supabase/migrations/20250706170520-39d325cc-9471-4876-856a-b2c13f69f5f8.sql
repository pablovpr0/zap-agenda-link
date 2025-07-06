
-- Criar tabela de serviços
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 60, -- duração em minutos
  price DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de agendamentos
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de configurações da empresa
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  working_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6}', -- 0=domingo, 1=segunda, etc
  working_hours_start TIME NOT NULL DEFAULT '09:00',
  working_hours_end TIME NOT NULL DEFAULT '18:00',
  appointment_interval INTEGER NOT NULL DEFAULT 30, -- intervalo em minutos
  max_simultaneous_appointments INTEGER NOT NULL DEFAULT 1,
  advance_booking_limit INTEGER NOT NULL DEFAULT 30, -- dias
  instagram_url TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  theme_color TEXT DEFAULT '#22c55e',
  welcome_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para services
CREATE POLICY "Companies can manage their services" ON public.services
  FOR ALL USING (company_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT USING (is_active = true);

-- Políticas para clients
CREATE POLICY "Companies can manage their clients" ON public.clients
  FOR ALL USING (company_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid()
  ));

-- Políticas para appointments
CREATE POLICY "Companies can manage their appointments" ON public.appointments
  FOR ALL USING (company_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Public can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- Políticas para company_settings
CREATE POLICY "Companies can manage their settings" ON public.company_settings
  FOR ALL USING (company_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Public can view company settings" ON public.company_settings
  FOR SELECT USING (true);

-- Criar índices para performance
CREATE INDEX idx_appointments_date_time ON public.appointments(company_id, appointment_date, appointment_time);
CREATE INDEX idx_company_settings_slug ON public.company_settings(slug);
CREATE INDEX idx_services_company_active ON public.services(company_id, is_active);

-- Função para gerar slug automaticamente baseado no nome da empresa
CREATE OR REPLACE FUNCTION public.generate_company_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar slug baseado no nome da empresa
  INSERT INTO public.company_settings (company_id, slug)
  VALUES (
    NEW.id, 
    LOWER(REGEXP_REPLACE(COALESCE(NEW.company_name, 'empresa'), '[^a-zA-Z0-9]', '-', 'g'))
  )
  ON CONFLICT (company_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar configurações quando uma empresa é criada/atualizada
CREATE TRIGGER on_profile_company_name_set
  AFTER INSERT OR UPDATE OF company_name ON public.profiles
  FOR EACH ROW 
  WHEN (NEW.company_name IS NOT NULL)
  EXECUTE FUNCTION public.generate_company_slug();
