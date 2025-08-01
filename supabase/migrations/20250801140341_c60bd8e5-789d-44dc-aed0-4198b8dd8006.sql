
-- PHASE 1: CRITICAL RLS POLICY FIXES

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Unified professionals access" ON professionals;
DROP POLICY IF EXISTS "Unified services access" ON services;
DROP POLICY IF EXISTS "Unified appointment management" ON appointments;
DROP POLICY IF EXISTS "Unified client management" ON clients;
DROP POLICY IF EXISTS "Unified company settings access" ON company_settings;
DROP POLICY IF EXISTS "Unified profile access" ON profiles;

-- PROFESSIONALS TABLE - Secure RLS policies
CREATE POLICY "Admin can manage professionals"
  ON professionals
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "Public can view active professionals for booking"
  ON professionals
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM company_settings cs 
      WHERE cs.company_id = professionals.company_id 
      AND cs.status_aberto = true
    )
  );

-- SERVICES TABLE - Secure RLS policies  
CREATE POLICY "Admin can manage services"
  ON services
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "Public can view active services for booking"
  ON services
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM company_settings cs 
      WHERE cs.company_id = services.company_id 
      AND cs.status_aberto = true
    )
  );

-- APPOINTMENTS TABLE - Secure RLS policies
CREATE POLICY "Admin can manage appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "Public can create appointments only"
  ON appointments
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_settings cs 
      WHERE cs.company_id = appointments.company_id 
      AND cs.status_aberto = true
    )
  );

-- CLIENTS TABLE - Secure RLS policies
CREATE POLICY "Admin can manage clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "Public can create clients only"
  ON clients
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_settings cs 
      WHERE cs.company_id = clients.company_id 
      AND cs.status_aberto = true
    )
  );

-- COMPANY_SETTINGS TABLE - Secure RLS policies
CREATE POLICY "Admin can manage company settings"
  ON company_settings
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "Public can view limited company settings for booking"
  ON company_settings
  FOR SELECT
  TO anon
  USING (status_aberto = true)
  WITH CHECK (false); -- Prevent any updates from public

-- PROFILES TABLE - Secure RLS policies
CREATE POLICY "Admin can manage own profile"
  ON profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Public can view basic profile info for booking"
  ON profiles
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM company_settings cs 
      WHERE cs.company_id = profiles.id 
      AND cs.status_aberto = true
    )
  );

-- PHASE 2: FIX DATABASE FUNCTIONS - Remove search_path vulnerabilities

-- Fix create_public_client function
CREATE OR REPLACE FUNCTION public.create_public_client(p_company_id uuid, p_name text, p_phone text, p_email text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  client_id UUID;
  v_company_exists BOOLEAN := FALSE;
BEGIN
  -- Input validation
  IF p_company_id IS NULL OR p_name IS NULL OR p_phone IS NULL THEN
    RAISE EXCEPTION 'Required parameters cannot be null';
  END IF;
  
  -- Validate company exists and is active
  SELECT EXISTS(
    SELECT 1 FROM company_settings 
    WHERE company_id = p_company_id AND status_aberto = true
  ) INTO v_company_exists;
  
  IF NOT v_company_exists THEN
    RAISE EXCEPTION 'Company not found or not active';
  END IF;
  
  -- Sanitize inputs
  p_name := trim(p_name);
  p_phone := regexp_replace(p_phone, '[^0-9+()-]', '', 'g');
  
  -- Validate input lengths
  IF length(p_name) < 2 OR length(p_name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;
  
  IF length(p_phone) < 10 OR length(p_phone) > 20 THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  -- Check if client already exists
  SELECT id INTO client_id
  FROM clients
  WHERE company_id = p_company_id AND phone = p_phone;
  
  IF client_id IS NULL THEN
    -- Create new client
    INSERT INTO clients (company_id, name, phone, email)
    VALUES (p_company_id, p_name, p_phone, p_email)
    RETURNING id INTO client_id;
  ELSE
    -- Update existing client
    UPDATE clients 
    SET name = p_name, email = COALESCE(p_email, email), updated_at = NOW()
    WHERE id = client_id;
  END IF;
  
  RETURN client_id;
END;
$function$;

-- Fix create_public_appointment function
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
SET search_path = 'public'
AS $function$
DECLARE
  appointment_id UUID;
  existing_appointment_id UUID;
  v_company_active BOOLEAN := FALSE;
  v_service_active BOOLEAN := FALSE;
  v_client_exists BOOLEAN := FALSE;
BEGIN
  -- Input validation
  IF p_company_id IS NULL OR p_client_id IS NULL OR p_service_id IS NULL OR 
     p_appointment_date IS NULL OR p_appointment_time IS NULL OR p_duration IS NULL THEN
    RAISE EXCEPTION 'Required parameters cannot be null';
  END IF;
  
  -- Validate appointment is not in the past
  IF p_appointment_date < CURRENT_DATE OR 
     (p_appointment_date = CURRENT_DATE AND p_appointment_time < CURRENT_TIME) THEN
    RAISE EXCEPTION 'Cannot book appointments in the past';
  END IF;
  
  -- Validate duration
  IF p_duration < 15 OR p_duration > 480 THEN
    RAISE EXCEPTION 'Duration must be between 15 minutes and 8 hours';
  END IF;
  
  -- Validate company is active
  SELECT EXISTS(
    SELECT 1 FROM company_settings 
    WHERE company_id = p_company_id AND status_aberto = true
  ) INTO v_company_active;
  
  IF NOT v_company_active THEN
    RAISE EXCEPTION 'Company not found or not accepting bookings';
  END IF;
  
  -- Validate service exists and is active
  SELECT EXISTS(
    SELECT 1 FROM services 
    WHERE id = p_service_id AND company_id = p_company_id AND is_active = true
  ) INTO v_service_active;
  
  IF NOT v_service_active THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;
  
  -- Validate client exists
  SELECT EXISTS(
    SELECT 1 FROM clients 
    WHERE id = p_client_id AND company_id = p_company_id
  ) INTO v_client_exists;
  
  IF NOT v_client_exists THEN
    RAISE EXCEPTION 'Client not found';
  END IF;
  
  -- Check for conflicting appointments
  SELECT id INTO existing_appointment_id
  FROM appointments
  WHERE company_id = p_company_id
    AND appointment_date = p_appointment_date
    AND appointment_time = p_appointment_time
    AND status IN ('confirmed', 'pending')
    AND (professional_id = p_professional_id OR professional_id IS NULL OR p_professional_id IS NULL);
  
  IF existing_appointment_id IS NOT NULL THEN
    RAISE EXCEPTION 'Time slot already booked';
  END IF;
  
  -- Create appointment
  INSERT INTO appointments (
    company_id, client_id, service_id, professional_id,
    appointment_date, appointment_time, duration, status
  ) VALUES (
    p_company_id, p_client_id, p_service_id, p_professional_id,
    p_appointment_date, p_appointment_time, p_duration, 'confirmed'
  ) RETURNING id INTO appointment_id;
  
  RETURN appointment_id;
END;
$function$;

-- Fix other database functions with search_path
CREATE OR REPLACE FUNCTION public.get_available_times(
  p_company_id uuid, 
  p_date date, 
  p_working_hours_start time without time zone, 
  p_working_hours_end time without time zone, 
  p_appointment_interval integer DEFAULT 30, 
  p_lunch_break_enabled boolean DEFAULT false, 
  p_lunch_start_time time without time zone DEFAULT '12:00:00'::time without time zone, 
  p_lunch_end_time time without time zone DEFAULT '13:00:00'::time without time zone
)
RETURNS TABLE(available_time time without time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    slot_time time;
    end_time time;
    interval_minutes interval;
BEGIN
    -- Input validation
    IF p_company_id IS NULL OR p_date IS NULL THEN
        RAISE EXCEPTION 'Company ID and date are required';
    END IF;
    
    -- Convert interval to interval type
    interval_minutes := (p_appointment_interval || ' minutes')::interval;
    
    slot_time := p_working_hours_start;
    end_time := p_working_hours_end;
    
    WHILE slot_time < end_time LOOP
        -- Check if not in lunch break
        IF NOT p_lunch_break_enabled OR 
           NOT (slot_time >= p_lunch_start_time AND slot_time < p_lunch_end_time) THEN
            
            -- Check if slot is available
            IF NOT EXISTS (
                SELECT 1 FROM appointments 
                WHERE company_id = p_company_id 
                AND appointment_date = p_date 
                AND appointment_time = slot_time 
                AND status IN ('confirmed', 'completed')
            ) THEN
                available_time := slot_time;
                RETURN NEXT;
            END IF;
        END IF;
        
        slot_time := slot_time + interval_minutes;
    END LOOP;
    
    RETURN;
END;
$function$;

-- Add rate limiting table for security
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL, -- IP address or phone number
    action_type text NOT NULL, -- 'booking', 'login', etc.
    attempts integer NOT NULL DEFAULT 1,
    window_start timestamp with time zone NOT NULL DEFAULT NOW(),
    blocked_until timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limits
CREATE POLICY "System only rate limits" 
  ON rate_limits 
  FOR ALL 
  USING (false);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- Add rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_attempts integer;
  v_window_start timestamp with time zone;
BEGIN
  -- Clean old entries
  DELETE FROM rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  -- Get current attempts in window
  SELECT attempts, window_start INTO v_attempts, v_window_start
  FROM rate_limits
  WHERE identifier = p_identifier 
    AND action_type = p_action_type
    AND window_start > NOW() - (p_window_minutes || ' minutes')::interval
  ORDER BY window_start DESC
  LIMIT 1;
  
  IF v_attempts IS NULL THEN
    -- First attempt in window
    INSERT INTO rate_limits (identifier, action_type, attempts, window_start)
    VALUES (p_identifier, p_action_type, 1, NOW());
    RETURN true;
  END IF;
  
  IF v_attempts >= p_max_attempts THEN
    -- Rate limit exceeded
    RETURN false;
  END IF;
  
  -- Increment attempts
  UPDATE rate_limits 
  SET attempts = attempts + 1
  WHERE identifier = p_identifier 
    AND action_type = p_action_type
    AND window_start = v_window_start;
  
  RETURN true;
END;
$function$;
