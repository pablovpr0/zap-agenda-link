
-- Verificar se as políticas RLS estão corretas para inserção pública
-- Política para inserção pública de clientes já existe, mas vamos garantir que esteja ativa
DROP POLICY IF EXISTS "Public create clients for booking" ON public.clients;
CREATE POLICY "Public create clients for booking" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

-- Política para inserção pública de agendamentos já existe, mas vamos garantir que esteja ativa  
DROP POLICY IF EXISTS "Public create appointments" ON public.appointments;
CREATE POLICY "Public create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

-- Adicionar índices para melhor performance nas consultas de disponibilidade
CREATE INDEX IF NOT EXISTS idx_appointments_company_date_time 
ON public.appointments (company_id, appointment_date, appointment_time);

CREATE INDEX IF NOT EXISTS idx_clients_company_phone 
ON public.clients (company_id, phone);
