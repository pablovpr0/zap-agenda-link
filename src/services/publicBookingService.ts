
import { supabase } from '@/integrations/supabase/client';
import { format, parse, isValid, isWithinInterval } from 'date-fns';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';
import { BRAZIL_TIMEZONE, getNowInBrazil } from '@/utils/timezone';
import { utcToZonedTime } from 'date-fns-tz';

// In-memory cache for available time slots (reset daily)
let timeSlotsCache: { [key: string]: string[] } = {};

// Function to invalidate the cache (e.g., after creating an appointment)
export const invalidateTimeSlotsCache = (companyId?: string, date?: string) => {
  if (!companyId) {
    // Invalidate all cache
    timeSlotsCache = {};
    devWarn('🧹 Cache de todos os horários esvaziado!');
  } else if (!date) {
    // Invalidate all cache for a company
    timeSlotsCache = Object.fromEntries(
      Object.entries(timeSlotsCache).filter(([key]) => !key.startsWith(companyId))
    );
    devWarn(`🧹 Cache de horários da empresa ${companyId} esvaziado!`);
  } else {
    // Invalidate specific date for a company
    const key = `${companyId}-${date}`;
    delete timeSlotsCache[key];
    devWarn(`🧹 Cache de horários para ${companyId} em ${date} esvaziado!`);
  }
};

// Function to load company data by slug
export const loadCompanyDataBySlug = async (slug: string) => {
  try {
    devLog(`🔍 Carregando dados da empresa pelo slug: ${slug}`);

    // Get company settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('slug', slug)
      .single();

    if (settingsError) {
      devError('Erro ao buscar configurações da empresa:', settingsError);
      throw new Error(`Empresa não encontrada: ${settingsError.message}`);
    }

    if (!settings) {
      throw new Error('Empresa não encontrada');
    }

    // Get profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', settings.company_id)
      .single();

    if (profileError) {
      devWarn('Erro ao buscar perfil da empresa:', profileError);
    }

    // Get services data
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', settings.company_id)
      .eq('is_active', true);

    if (servicesError) {
      devWarn('Erro ao buscar serviços:', servicesError);
    }

    devLog('✅ Dados da empresa carregados com sucesso');
    return {
      settings,
      profileData,
      servicesData: servicesData || []
    };

  } catch (error) {
    devError('Erro geral ao carregar dados da empresa:', error);
    throw error;
  }
};

// Function to fetch active professionals
export const fetchActiveProfessionals = async (companyId: string) => {
  try {
    const { data: professionals, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) {
      devError('Erro ao buscar profissionais:', error);
      throw error;
    }

    return professionals || [];
  } catch (error) {
    devError('Erro geral ao buscar profissionais:', error);
    throw error;
  }
};

// Function to verify if a time slot is available
export const verifyTimeSlotAvailability = async (
  companyId: string,
  selectedDate: string,
  selectedTime: string,
  serviceDuration: number
): Promise<boolean> => {
  try {
    devLog(`⏱️  Verificando disponibilidade do horário ${selectedTime} em ${selectedDate} para ${companyId}`);

    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        appointment_time,
        duration
      `)
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .in('status', ['confirmed', 'completed'])
      .overlaps('appointment_time', [selectedTime]);

    if (appointmentsError) {
      devError('Erro ao buscar agendamentos existentes:', appointmentsError);
      return false;
    }

    if (!existingAppointments || existingAppointments.length === 0) {
      devLog(`✅ Horário ${selectedTime} disponível em ${selectedDate} para ${companyId}`);
      return true;
    }

    // Check for overlaps
    for (const appointment of existingAppointments) {
      const existingStartTime = appointment.appointment_time;
      const existingDuration = appointment.duration || 60; // Default duration

      const selectedStartTime = selectedTime;

      const existingStart = parse(existingStartTime, 'HH:mm', new Date());
      const selectedStart = parse(selectedStartTime, 'HH:mm', new Date());

      const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);
      const selectedEnd = new Date(selectedStart.getTime() + serviceDuration * 60000);

      if (isWithinInterval(selectedStart, { start: existingStart, end: existingEnd }) ||
          isWithinInterval(selectedEnd, { start: existingStart, end: existingEnd }) ||
          isWithinInterval(existingStart, { start: selectedStart, end: selectedEnd }) ||
          isWithinInterval(existingEnd, { start: selectedStart, end: selectedEnd })) {
        devLog(`❌ Horário ${selectedTime} INDISPONÍVEL em ${selectedDate} devido a conflito com agendamento existente.`);
        return false; // Time slot is not available
      }
    }

    devLog(`✅ Horário ${selectedTime} disponível em ${selectedDate} (sem conflitos detectados)`);
    return true;

  } catch (error) {
    devError('Erro ao verificar disponibilidade do horário:', error);
    return false;
  }
};

export const checkAvailableTimes = async (
  companyId: string,
  selectedDate: string,
  serviceDuration: number
): Promise<string[]> => {
  try {
    devLog(`🔍 Verificando horários disponíveis para ${companyId} em ${selectedDate} (duração: ${serviceDuration}min)`);
    
    // Get company working hours and schedule settings
    const { data: companySettings, error: settingsError } = await supabase
      .from('company_settings')
      .select('working_days, working_hours_start, working_hours_end, lunch_break_enabled, lunch_start_time, lunch_end_time, advance_booking_limit, appointment_interval')
      .eq('company_id', companyId)
      .single();

    if (settingsError) {
      devError('Erro ao buscar configurações da empresa:', settingsError);
      return [];
    }

    if (!companySettings) {
      devError('Configurações da empresa não encontradas');
      return [];
    }

    // Get existing appointments for the selected date
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        appointment_time,
        duration,
        status,
        services(duration)
      `)
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .in('status', ['confirmed', 'completed']);

    if (appointmentsError) {
      devError('Erro ao buscar agendamentos existentes:', appointmentsError);
      return [];
    }

    const {
      working_days: workingDays,
      working_hours_start: startTime,
      working_hours_end: endTime,
      lunch_break_enabled,
      lunch_start_time: lunchBreakStart,
      lunch_end_time: lunchBreakEnd,
      appointment_interval: timeSlotInterval
    } = companySettings;

    // Validate working days
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();
    if (!workingDays.includes(dayOfWeek)) {
      devLog(`🚫 Não há expediente no dia ${dayOfWeek}`);
      return [];
    }

    // Parse working hours
    if (!startTime || !endTime) {
      devError('Horário de funcionamento inválido');
      return [];
    }

    // Generate time slots
    const availableTimeSlots: string[] = [];
    let currentTime = startTime;

    while (currentTime < endTime) {
      const [hours, minutes] = currentTime.split(':').map(Number);
      const now = getNowInBrazil();
      const appointmentDate = new Date(selectedDateObj);
      appointmentDate.setHours(hours, minutes, 0, 0);

      // Check if the time slot is in the future
      if (appointmentDate > now) {
        availableTimeSlots.push(currentTime);
      } else {
        devLog(`⏰ Ignorando horário passado: ${currentTime}`);
      }

      // Increment time
      const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
      const nextMinutes = currentMinutes + (timeSlotInterval || 30);
      const nextHours = currentHours + Math.floor(nextMinutes / 60);
      const remainingMinutes = nextMinutes % 60;

      currentTime = `${String(nextHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
    }

    // Remove time slots during lunch break
    if (lunch_break_enabled && lunchBreakStart && lunchBreakEnd) {
      const filteredTimeSlots = availableTimeSlots.filter(time => {
        return !(time >= lunchBreakStart && time < lunchBreakEnd);
      });
      availableTimeSlots.length = 0; // Clear the array
      availableTimeSlots.push(...filteredTimeSlots); // Push the filtered time slots
    }

    // Remove conflicting time slots
    if (existingAppointments && existingAppointments.length > 0) {
      const filteredTimeSlots = availableTimeSlots.filter(time => {
        return !existingAppointments.some(appointment => {
          const existingStartTime = appointment.appointment_time;
          const existingDuration = appointment.duration || 60; // Default duration

          const selectedStartTime = time;

          const existingStart = parse(existingStartTime, 'HH:mm', new Date());
          const selectedStart = parse(selectedStartTime, 'HH:mm', new Date());

          const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);
          const selectedEnd = new Date(selectedStart.getTime() + serviceDuration * 60000);

          return isWithinInterval(selectedStart, { start: existingStart, end: existingEnd }) ||
                 isWithinInterval(selectedEnd, { start: existingStart, end: existingEnd }) ||
                 isWithinInterval(existingStart, { start: selectedStart, end: selectedEnd }) ||
                 isWithinInterval(existingEnd, { start: selectedStart, end: selectedEnd });
        });
      });
      availableTimeSlots.length = 0; // Clear the array
      availableTimeSlots.push(...filteredTimeSlots); // Push the filtered time slots
    }

    devLog(`✅ Horários disponíveis: ${availableTimeSlots.join(', ')}`);
    return availableTimeSlots;
  } catch (error) {
    devError('Erro geral ao verificar horários disponíveis:', error);
    return [];
  }
};
