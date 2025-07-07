
-- Adicionar campo de telefone e limite de agendamentos mensais na tabela company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS monthly_appointments_limit INTEGER DEFAULT 4;

-- Atualizar a política RLS para incluir os novos campos
-- (As políticas existentes já cobrem essas colunas)
