
-- Force complete schema cache refresh by dropping function with CASCADE
DROP FUNCTION IF EXISTS public.create_public_appointment CASCADE;

-- Wait for cache to clear and recreate with explicit parameter validation
CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_company_id uuid,
  p_client_id uuid, 
  p_service_id uuid,
  p_professional_id uuid,
  p_appointment_date date,
  p_appointment_time time without time zone,
  p_duration integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  appointment_id UUID;
  existing_appointment_id UUID;
  service_exists BOOLEAN := FALSE;
  client_exists BOOLEAN := FALSE;
  company_exists BOOLEAN := FALSE;
BEGIN
  -- Enhanced logging for debugging
  RAISE NOTICE 'Creating appointment with params: company_id=%, client_id=%, service_id=%, professional_id=%, date=%, time=%, duration=%', 
    p_company_id, p_client_id, p_service_id, p_professional_id, p_appointment_date, p_appointment_time, p_duration;

  -- Validate required parameters
  IF p_company_id IS NULL OR p_client_id IS NULL OR p_service_id IS NULL OR 
     p_appointment_date IS NULL OR p_appointment_time IS NULL OR p_duration IS NULL THEN
    RAISE EXCEPTION 'Parâmetros obrigatórios não podem ser nulos';
  END IF;

  -- Validate company exists
  SELECT EXISTS(SELECT 1 FROM company_settings WHERE company_id = p_company_id) INTO company_exists;
  IF NOT company_exists THEN
    RAISE EXCEPTION 'Empresa não encontrada: %', p_company_id;
  END IF;

  -- Validate client exists
  SELECT EXISTS(SELECT 1 FROM clients WHERE id = p_client_id AND company_id = p_company_id) INTO client_exists;
  IF NOT client_exists THEN
    RAISE EXCEPTION 'Cliente não encontrado: %', p_client_id;
  END IF;

  -- Validate service exists
  SELECT EXISTS(SELECT 1 FROM services WHERE id = p_service_id AND company_id = p_company_id AND is_active = true) INTO service_exists;
  IF NOT service_exists THEN
    RAISE EXCEPTION 'Serviço não encontrado ou inativo: %', p_service_id;
  END IF;

  -- Check for conflicting appointments with enhanced logic
  SELECT id INTO existing_appointment_id
  FROM appointments
  WHERE company_id = p_company_id
    AND appointment_date = p_appointment_date
    AND appointment_time = p_appointment_time
    AND status IN ('confirmed', 'pending')
    AND (professional_id = p_professional_id OR professional_id IS NULL OR p_professional_id IS NULL)
  LIMIT 1;
  
  IF existing_appointment_id IS NOT NULL THEN
    RAISE EXCEPTION 'Horário já está ocupado para este profissional na data % às %', p_appointment_date, p_appointment_time;
  END IF;

  -- Insert the new appointment with explicit column mapping
  INSERT INTO appointments (
    company_id,
    client_id,
    service_id,
    professional_id,
    appointment_date,
    appointment_time,
    duration,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_company_id,
    p_client_id,
    p_service_id,
    p_professional_id,
    p_appointment_date,
    p_appointment_time,
    p_duration,
    'confirmed',
    NOW(),
    NOW()
  ) RETURNING id INTO appointment_id;
  
  IF appointment_id IS NULL THEN
    RAISE EXCEPTION 'Falha ao criar agendamento - ID não retornado';
  END IF;

  RAISE NOTICE 'Agendamento criado com sucesso: %', appointment_id;
  RETURN appointment_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar agendamento: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$function$;

-- Grant explicit permissions
GRANT EXECUTE ON FUNCTION public.create_public_appointment(uuid, uuid, uuid, uuid, date, time without time zone, integer) TO anon, authenticated;

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';
