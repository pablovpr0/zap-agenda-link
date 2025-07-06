
-- Criar buckets para imagens da empresa
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('company-logos', 'company-logos', true),
  ('company-covers', 'company-covers', true);

-- Criar políticas para os buckets de logos
CREATE POLICY "Company logos are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'company-logos');

CREATE POLICY "Users can upload company logos" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their company logos" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their company logos" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

-- Criar políticas para os buckets de capas
CREATE POLICY "Company covers are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'company-covers');

CREATE POLICY "Users can upload company covers" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'company-covers' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their company covers" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'company-covers' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their company covers" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'company-covers' AND auth.uid() IS NOT NULL);

-- Habilitar realtime para appointments
ALTER TABLE appointments REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE appointments;
