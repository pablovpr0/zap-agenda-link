
-- Criar tabela para profissionais/equipe
CREATE TABLE public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  role TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de profissionais
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Política para empresas gerenciarem seus profissionais
CREATE POLICY "Companies can manage their professionals" 
  ON public.professionals 
  FOR ALL 
  USING (company_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.id = auth.uid()
  ));

-- Política para visualização pública dos profissionais ativos
CREATE POLICY "Public can view active professionals" 
  ON public.professionals 
  FOR SELECT 
  USING (is_active = true);

-- Adicionar coluna professional_id na tabela appointments
ALTER TABLE public.appointments 
ADD COLUMN professional_id UUID REFERENCES professionals(id);

-- Atualizar a estrutura da tabela company_settings para incluir horários de almoço por dia
-- Como já existe working_days como array, vamos adicionar colunas para horários de almoço
ALTER TABLE public.company_settings
ADD COLUMN lunch_break_enabled BOOLEAN DEFAULT false,
ADD COLUMN lunch_start_time TIME DEFAULT '12:00:00',
ADD COLUMN lunch_end_time TIME DEFAULT '13:00:00';
