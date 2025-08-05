-- Atualizar função get_available_times para trabalhar corretamente com timezone Brasil
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
SET search_path TO 'public'
AS $$
DECLARE
    slot_time time;
    end_time time;
    interval_minutes interval;
    current_time_brazil time;
    today_brazil date;
BEGIN
    -- Converter intervalo para interval type
    interval_minutes := (p_appointment_interval || ' minutes')::interval;
    
    -- Obter data e hora atual no Brasil (UTC-3)
    today_brazil := (NOW() AT TIME ZONE 'America/Sao_Paulo')::date;
    current_time_brazil := (NOW() AT TIME ZONE 'America/Sao_Paulo')::time;
    
    -- Inicializar tempo atual
    slot_time := p_working_hours_start;
    end_time := p_working_hours_end;
    
    -- Log para debug
    RAISE NOTICE 'Gerando horários para data %, hoje no Brasil %, hora atual %', 
        p_date, today_brazil, current_time_brazil;
    
    -- Loop através dos horários possíveis
    WHILE slot_time < end_time LOOP
        -- Se é hoje no Brasil, filtrar horários que já passaram (com margem de 30min)
        IF p_date = today_brazil AND slot_time <= (current_time_brazil + '30 minutes'::interval) THEN
            RAISE NOTICE 'Horário % ignorado por já ter passado', slot_time;
            slot_time := slot_time + interval_minutes;
            CONTINUE;
        END IF;
        
        -- Verificar se não está no horário de almoço
        IF NOT p_lunch_break_enabled OR 
           NOT (slot_time >= p_lunch_start_time AND slot_time < p_lunch_end_time) THEN
            
            -- Verificar se horário não está ocupado
            IF NOT EXISTS (
                SELECT 1 FROM appointments 
                WHERE company_id = p_company_id 
                AND appointment_date = p_date 
                AND appointment_time = slot_time 
                AND status IN ('confirmed', 'completed', 'scheduled')
            ) THEN
                available_time := slot_time;
                RETURN NEXT;
            END IF;
        ELSE
            RAISE NOTICE 'Horário % ignorado por estar no almoço', slot_time;
        END IF;
        
        -- Avançar para próximo intervalo
        slot_time := slot_time + interval_minutes;
    END LOOP;
    
    RETURN;
END;
$$;