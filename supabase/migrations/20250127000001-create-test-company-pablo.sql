-- Criar dados de teste para empresa "pablo"
-- Este arquivo cria uma empresa de teste para verificar o funcionamento do link público

-- Primeiro, vamos criar um usuário de teste (simulando o que seria criado via auth)
-- Nota: Em produção, isso seria feito através do sistema de autenticação do Supabase

-- Inserir perfil da empresa de teste
INSERT INTO public.profiles (id, company_name, business_type, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Barbearia do Pablo',
  'Barbearia',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  business_type = EXCLUDED.business_type,
  updated_at = NOW();

-- Inserir configurações da empresa com slug "pablo"
INSERT INTO public.company_settings (
  id,
  company_id,
  slug,
  working_days,
  working_hours_start,
  working_hours_end,
  appointment_interval,
  max_simultaneous_appointments,
  advance_booking_limit,
  theme_color,
  welcome_message,
  lunch_break_enabled,
  lunch_start_time,
  lunch_end_time,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'pablo',
  '{1,2,3,4,5,6}', -- Segunda a sábado
  '09:00:00',
  '18:00:00',
  30, -- 30 minutos de intervalo
  1, -- 1 agendamento simultâneo
  30, -- 30 dias de antecedência
  '#22c55e',
  'Bem-vindo à Barbearia do Pablo! Agende seu horário e venha cuidar do seu visual.',
  true,
  '12:00:00',
  '13:00:00',
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  working_days = EXCLUDED.working_days,
  working_hours_start = EXCLUDED.working_hours_start,
  working_hours_end = EXCLUDED.working_hours_end,
  appointment_interval = EXCLUDED.appointment_interval,
  max_simultaneous_appointments = EXCLUDED.max_simultaneous_appointments,
  advance_booking_limit = EXCLUDED.advance_booking_limit,
  theme_color = EXCLUDED.theme_color,
  welcome_message = EXCLUDED.welcome_message,
  lunch_break_enabled = EXCLUDED.lunch_break_enabled,
  lunch_start_time = EXCLUDED.lunch_start_time,
  lunch_end_time = EXCLUDED.lunch_end_time,
  updated_at = NOW();

-- Inserir alguns serviços de teste
INSERT INTO public.services (id, company_id, name, description, duration, price, is_active, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Corte Masculino',
    'Corte de cabelo masculino tradicional',
    30,
    25.00,
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Barba',
    'Aparar e modelar barba',
    20,
    15.00,
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Corte + Barba',
    'Pacote completo: corte de cabelo e barba',
    45,
    35.00,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Inserir um profissional de teste
INSERT INTO public.professionals (id, company_id, name, phone, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Pablo Silva',
  '(11) 99999-9999',
  'Barbeiro',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;