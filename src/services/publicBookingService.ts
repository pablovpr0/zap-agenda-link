import { supabase } from '@/integrations/supabase/client';
import { format, parse, isValid, isWithinInterval } from 'date-fns';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';
import { BRAZIL_TIMEZONE, getTodayInBrazil, getCurrentTimeInBrazil } from '@/utils/timezone';
import { toZonedTime } from 'date-fns-tz';

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
        duration,
        status,
        services(duration)
      `)
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      devError('❌ Erro ao verificar agendamentos:', appointmentsError);
      return false;
    }

    if (!existingAppointments || existingAppointments.length === 0) {
      devLog('✅ Nenhum agendamento encontrado para esta data');
      return true;
    }

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

    devLog('✅ Horário está disponível');
    return true;
  } catch (error) {
    devError('❌ Erro ao verificar disponibilidade:', error);
    return false;
  }
};

/**
 * Check available time slots for a specific date using Brazil timezone
 */
export const checkAvailableTimes = async (
  companyId: string,
  selectedDate: string,
  serviceDuration: number = 60
): Promise<string[]> => {
  try {
    devLog(`🔄 Buscando horários disponíveis para ${selectedDate} (serviço: ${serviceDuration}min)`);

    // Validate date format
    if (!selectedDate || !selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      devError('Formato de data inválido');
      return [];
    }

    // Check cache first
    const cacheKey = `${companyId}-${selectedDate}`;
    if (timeSlotsCache[cacheKey]) {
      devLog('📋 Retornando horários do cache');
      return timeSlotsCache[cacheKey];
    }

    // Get working schedule for the specific day of week using daily_schedules
    const date = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = date.getDay();

    devLog(`📅 Verificando configuração para dia da semana: ${dayOfWeek}`);

    const { data: scheduleConfig, error: scheduleError } = await supabase
      .from('daily_schedules')
      .select('start_time, end_time, is_active, has_lunch_break, lunch_start, lunch_end')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (scheduleError || !scheduleConfig) {
      devLog('⚠️ Nenhuma configuração de horário encontrada para este dia');
      // Fallback to company_settings
      const { data: companySettings, error: settingsError } = await supabase
        .from('company_settings')
        .select('working_days, working_hours_start, working_hours_end, lunch_break_enabled, lunch_start_time, lunch_end_time, advance_booking_limit, appointment_interval')
        .eq('company_id', companyId)
        .single();

      if (settingsError || !companySettings) {
        devError('❌ Configurações da empresa não encontradas');
        return [];
      }

      // Check if company is open on this day
      const workingDays = companySettings.working_days || [];
      if (!workingDays.includes(dayOfWeek === 0 ? 7 : dayOfWeek)) {
        devLog(`⚠️ Empresa fechada no dia da semana: ${dayOfWeek}`);
        return [];
      }

      // Use company_settings as fallback
      const startTime = companySettings.working_hours_start;
      const endTime = companySettings.working_hours_end;
      const timeSlotInterval = companySettings.appointment_interval || 30;
      const lunchBreakEnabled = companySettings.lunch_break_enabled;
      const lunchBreakStart = companySettings.lunch_start_time;
      const lunchBreakEnd = companySettings.lunch_end_time;

      return await generateTimeSlots(
        companyId,
        selectedDate,
        startTime,
        endTime,
        timeSlotInterval,
        serviceDuration,
        lunchBreakEnabled,
        lunchBreakStart,
        lunchBreakEnd
      );
    }

    // Use daily_schedules data
    const startTime = scheduleConfig.start_time;
    const endTime = scheduleConfig.end_time;
    const timeSlotInterval = 30; // Default interval
    const lunchBreakEnabled = scheduleConfig.has_lunch_break;
    const lunchBreakStart = scheduleConfig.lunch_start;
    const lunchBreakEnd = scheduleConfig.lunch_end;

    const availableSlots = await generateTimeSlots(
      companyId,
      selectedDate,
      startTime,
      endTime,
      timeSlotInterval,
      serviceDuration,
      lunchBreakEnabled,
      lunchBreakStart,
      lunchBreakEnd
    );

    // Cache the result
    timeSlotsCache[cacheKey] = availableSlots;

    devLog(`✅ ${availableSlots.length} horários disponíveis encontrados`);
    return availableSlots;

  } catch (error) {
    devError('❌ Erro ao buscar horários disponíveis:', error);
    return [];
  }
};

/**
 * Generate available time slots using Brazil timezone
 */
const generateTimeSlots = async (
  companyId: string,
  selectedDate: string,
  startTime: string,
  endTime: string,
  timeSlotInterval: number,
  serviceDuration: number,
  lunchBreakEnabled?: boolean,
  lunchBreakStart?: string,
  lunchBreakEnd?: string
): Promise<string[]> => {
  const availableTimeSlots: string[] = [];
  const today = getTodayInBrazil();
  const currentTime = getCurrentTimeInBrazil();

  devLog(`🕐 Gerando slots para ${selectedDate} (hoje: ${today}, agora: ${currentTime})`);

  // Parse working hours
  if (!startTime || !endTime) {
    devError('Horário de funcionamento inválido');
    return [];
  }

  // Get existing appointments for the date
  const { data: existingAppointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('appointment_time, duration, status, services(duration)')
    .eq('company_id', companyId)
    .eq('appointment_date', selectedDate)
    .neq('status', 'cancelled');

  if (appointmentsError) {
    devError('❌ Erro ao buscar agendamentos existentes:', appointmentsError);
    return [];
  }

  // Generate time slots
  let currentSlotTime = startTime;

  while (currentSlotTime < endTime) {
    // Skip past times if it's today
    if (selectedDate === today) {
      const [currentHour, currentMinute] = currentTime.split(':').map(Number);
      const [slotHour, slotMinute] = currentSlotTime.split(':').map(Number);
      
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      const slotTotalMinutes = slotHour * 60 + slotMinute;
      
      // Skip if slot is in the past (with 30min buffer)
      if (slotTotalMinutes <= currentTotalMinutes + 30) {
        currentSlotTime = incrementTime(currentSlotTime, timeSlotInterval);
        continue;
      }
    }

    // Check if slot is during lunch break
    if (lunchBreakEnabled && lunchBreakStart && lunchBreakEnd) {
      if (currentSlotTime >= lunchBreakStart && currentSlotTime < lunchBreakEnd) {
        currentSlotTime = incrementTime(currentSlotTime, timeSlotInterval);
        continue;
      }
    }

    // Check if there's enough time for the service before end of day
    const slotEndTime = addMinutesToTime(currentSlotTime, serviceDuration);
    if (slotEndTime > endTime) {
      break;
    }

    // Check if slot conflicts with existing appointments
    const hasConflict = existingAppointments?.some(apt => {
      const aptTime = apt.appointment_time.substring(0, 5);
      const aptDuration = apt.services?.duration || apt.duration || 60;
      
      return checkTimeConflict(currentSlotTime, serviceDuration, aptTime, aptDuration);
    });

    if (!hasConflict) {
      availableTimeSlots.push(currentSlotTime);
    }

    currentSlotTime = incrementTime(currentSlotTime, timeSlotInterval);
  }

  return availableTimeSlots;
};

/**
 * Helper function to increment time by minutes
 */
const incrementTime = (timeStr: string, minutes: number): string => {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
};

/**
 * Helper function to add minutes to time
 */
const addMinutesToTime = (timeStr: string, minutes: number): string => {
  return incrementTime(timeStr, minutes);
};

/**
 * Helper function to check time conflicts
 */
const checkTimeConflict = (
  newStartTime: string,
  newDuration: number,
  existingStartTime: string,
  existingDuration: number
): boolean => {
  const newStart = timeToMinutes(newStartTime);
  const newEnd = newStart + newDuration;
  const existingStart = timeToMinutes(existingStartTime);
  const existingEnd = existingStart + existingDuration;

  // Check for overlap
  return (newStart < existingEnd) && (newEnd > existingStart);
};

/**
 * Helper function to convert time string to minutes
 */
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};
