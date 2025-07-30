
-- Drop and recreate the create_public_appointment function to force schema cache refresh
DROP FUNCTION IF EXISTS public.create_public_appointment(uuid, uuid, uuid, uuid, date, time without time zone, integer);

-- Recreate the function with proper parameter order and improved error handling
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
  existing_appointment UUID;
BEGIN
  -- Check for conflicting appointments first
  SELECT id INTO existing_appointment
  FROM appointments
  WHERE company_id = p_company_id
    AND appointment_date = p_appointment_date
    AND appointment_time = p_appointment_time
    AND status != 'cancelled'
    AND (professional_id = p_professional_id OR professional_id IS NULL)
  LIMIT 1;
  
  IF existing_appointment IS NOT NULL THEN
    RAISE EXCEPTION 'Horário já está ocupado para este profissional';
  END IF;

  -- Insert the new appointment
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar agendamento: %', SQLERRM;
END;
$function$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_public_appointment TO anon, authenticated;
