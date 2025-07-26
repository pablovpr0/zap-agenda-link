-- Adicionar campos em falta na tabela company_settings para completar os dados da empresa
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS tempo_entrega integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS tempo_retirada integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS status_aberto boolean DEFAULT true;

-- Adicionar campos de horário de funcionamento se necessário
-- (Os campos working_hours_start e working_hours_end já existem e podem ser usados)

-- Adicionar índice único no slug para garantir que não haja duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_settings_slug_unique ON public.company_settings(slug);

-- Comentário: Os campos já existentes que atendem aos requisitos:
-- - id (UUID, PK) ✓
-- - slug (texto, agora único) ✓  
-- - logo_url (imagem_perfil) ✓
-- - cover_image_url (imagem_capa) ✓
-- - theme_color (configuração visual) ✓
-- - welcome_message (descrição/mensagem) ✓
-- - working_hours_start (horario_abertura) ✓
-- - working_hours_end (horario_fechamento) ✓
-- - phone (contato) ✓
-- - address (endereço) ✓
-- - created_at e updated_at ✓

-- Para o nome da empresa, usamos a tabela profiles que já tem company_name