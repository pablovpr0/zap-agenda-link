
-- 1. Remover temporariamente as políticas conflitantes
DROP POLICY IF EXISTS "Companies manage own clients" ON public.clients;
DROP POLICY IF EXISTS "Public create clients for booking" ON public.clients;

-- 2. Recriar as políticas com ordem e prioridade corretas
-- Política mais restritiva primeiro (para operações autenticadas)
CREATE POLICY "Companies manage own clients" 
ON public.clients 
FOR ALL 
USING (auth.uid() = company_id)
WITH CHECK (auth.uid() = company_id);

-- Política pública para inserção (com prioridade maior)
CREATE POLICY "Public booking client creation" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

-- 3. Fazer o mesmo para appointments para garantir consistência
DROP POLICY IF EXISTS "Companies manage own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public create appointments" ON public.appointments;

CREATE POLICY "Companies manage own appointments" 
ON public.appointments 
FOR ALL 
USING (auth.uid() = company_id)
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Public booking appointment creation" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

-- 4. Criar função auxiliar para inserção de clientes públicos (caso necessário)
CREATE OR REPLACE FUNCTION public.create_public_client(
  p_company_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_id UUID;
BEGIN
  -- Verificar se cliente já existe
  SELECT id INTO client_id
  FROM clients
  WHERE company_id = p_company_id AND phone = p_phone;
  
  -- Se não existe, criar novo cliente
  IF client_id IS NULL THEN
    INSERT INTO clients (company_id, name, phone, email)
    VALUES (p_company_id, p_name, p_phone, p_email)
    RETURNING id INTO client_id;
  ELSE
    -- Atualizar nome se necessário
    UPDATE clients 
    SET name = p_name, email = COALESCE(p_email, email)
    WHERE id = client_id;
  END IF;
  
  RETURN client_id;
END;
$$;

-- 5. Função auxiliar para criação de agendamentos públicos
CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_company_id UUID,
  p_client_id UUID,
  p_service_id UUID,
  p_professional_id UUID,
  p_appointment_date DATE,
  p_appointment_time TIME,
  p_duration INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_id UUID;
BEGIN
  INSERT INTO appointments (
    company_id,
    client_id,
    service_id,
    professional_id,
    appointment_date,
    appointment_time,
    duration,
    status
  ) VALUES (
    p_company_id,
    p_client_id,
    p_service_id,
    p_professional_id,
    p_appointment_date,
    p_appointment_time,
    p_duration,
    'confirmed'
  ) RETURNING id INTO appointment_id;
  
  RETURN appointment_id;
END;
$$;
