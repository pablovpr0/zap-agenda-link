-- Adicionar campo para armazenar o ID do tema selecionado
ALTER TABLE public.company_settings 
ADD COLUMN selected_theme_id TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.company_settings.selected_theme_id IS 'ID do tema selecionado para a página pública de agendamento';