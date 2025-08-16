import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from '@/utils/console';
import { CompanySettings } from '@/services/companySettingsService';

export interface ScheduleSlot {
  time: string;
  available: boolean;
  conflictCount: number;
}

export interface DaySchedule {
  date: string;
  isActive: boolean;
  slots: ScheduleSlot[];
  totalSlots: number;
  availableSlots: number;
}

/**
 * Gera horários disponíveis baseado nas configurações dinâmicas da empresa
 */
export const generateDynamicSchedule = async (
  companyId: string,
  settings: CompanySettings,
  targetDate: string
): Promise<string[]> => {
  try {
    devLog('🔄 Gerando horários dinâmicos:', { companyId, targetDate });

    const date = new Date(targetDate);
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
    const daySettings = settings.opening_hours[dayOfWeek];

    // Verificar se o dia está ativo
    if (!daySettings || !daySettings.active) {
      devLog('❌ Dia não está ativo:', dayOfWeek);
      return [];
    }

    // Verificar se a data está dentro do limite permitido
    if (!isDateWithinBookingLimit(settings, date)) {
      devLog('❌ Data fora do limite de agendamento');
      return [];
    }

    // Buscar agendamentos existentes para o dia
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('appointment_time, service_duration')
      .eq('company_id', companyId)
      .eq('appointment_date', targetDate)
      .in('status', ['confirmed', 'pending']);

    if (error) {
      devError('❌ Erro ao buscar agendamentos existentes:', error);
      return [];
    }

    // Gerar slots baseado nas configurações
    const slots = generateSlotsFromSettings(settings, dayOfWeek, existingAppointments || []);
    
    devLog('✅ Horários gerados:', { totalSlots: slots.length, availableSlots: slots.filter(s => s.available).length });
    
    return slots.filter(slot => slot.available).map(slot => slot.time);

  } catch (error) {
    devError('❌ Erro na geração de horários dinâmicos:', error);
    return [];
  }
};

/**
 * Gera slots de horário baseado nas configurações
 */
export const generateSlotsFromSettings = (
  settings: CompanySettings,
  dayOfWeek: string,
  existingAppointments: Array<{ appointment_time: string; service_duration?: number }>
): ScheduleSlot[] => {
  const daySettings = settings.opening_hours[dayOfWeek];
  
  if (!daySettings || !daySettings.active) {
    return [];
  }

  const slots: ScheduleSlot[] = [];
  const [openHour, openMinute] = daySettings.open.split(':').map(Number);
  const [closeHour, closeMinute] = daySettings.close.split(':').map(Number);
  
  let currentTime = openHour * 60 + openMinute; // em minutos
  const closeTime = closeHour * 60 + closeMinute;
  
  while (currentTime < closeTime) {
    const hour = Math.floor(currentTime / 60);
    const minute = currentTime % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Verificar se está no horário de almoço
    let isLunchTime = false;
    if (settings.lunch_break.active) {
      const [lunchStartHour, lunchStartMinute] = settings.lunch_break.start.split(':').map(Number);
      const [lunchEndHour, lunchEndMinute] = settings.lunch_break.end.split(':').map(Number);
      
      const lunchStart = lunchStartHour * 60 + lunchStartMinute;
      const lunchEnd = lunchEndHour * 60 + lunchEndMinute;
      
      isLunchTime = currentTime >= lunchStart && currentTime < lunchEnd;
    }
    
    // Contar conflitos com agendamentos existentes
    const conflictCount = existingAppointments.filter(appointment => {
      const [appHour, appMinute] = appointment.appointment_time.split(':').map(Number);
      const appTime = appHour * 60 + appMinute;
      const appDuration = appointment.service_duration || 30;
      
      return currentTime >= appTime && currentTime < (appTime + appDuration);
    }).length;
    
    slots.push({
      time: timeString,
      available: !isLunchTime && conflictCount === 0,
      conflictCount
    });
    
    currentTime += settings.slot_interval_minutes;
  }
  
  return slots;
};

/**
 * Verifica se uma data está dentro do limite de agendamento
 */
export const isDateWithinBookingLimit = (
  settings: CompanySettings,
  targetDate: Date
): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Verificar se permite agendamento no mesmo dia
  if (diffDays === 0 && !settings.same_day_booking) {
    return false;
  }
  
  // Verificar limite de dias futuros
  if (diffDays > settings.advance_booking_limit) {
    return false;
  }
  
  return diffDays >= 0;
};

/**
 * Gera datas disponíveis baseado nas configurações
 */
export const generateAvailableDatesFromSettings = (
  settings: CompanySettings
): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = 0; i <= settings.advance_booking_limit; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Verificar se permite agendamento no mesmo dia
    if (i === 0 && !settings.same_day_booking) {
      continue;
    }
    
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
    const daySettings = settings.opening_hours[dayOfWeek];
    
    // Verificar se o dia está ativo
    if (daySettings && daySettings.active) {
      dates.push(date);
    }
  }
  
  return dates;
};

/**
 * Obtém estatísticas de disponibilidade para um período
 */
export const getAvailabilityStats = async (
  companyId: string,
  settings: CompanySettings,
  startDate: string,
  endDate: string
): Promise<{
  totalDays: number;
  activeDays: number;
  totalSlots: number;
  availableSlots: number;
  occupancyRate: number;
}> => {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('appointment_date, appointment_time, service_duration')
      .eq('company_id', companyId)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .in('status', ['confirmed', 'pending']);

    if (error) throw error;

    let totalDays = 0;
    let activeDays = 0;
    let totalSlots = 0;
    let availableSlots = 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      totalDays++;
      
      const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
      const daySettings = settings.opening_hours[dayOfWeek];
      
      if (daySettings && daySettings.active && isDateWithinBookingLimit(settings, date)) {
        activeDays++;
        
        const dateString = date.toISOString().split('T')[0];
        const dayAppointments = appointments?.filter(app => app.appointment_date === dateString) || [];
        
        const slots = generateSlotsFromSettings(settings, dayOfWeek, dayAppointments);
        totalSlots += slots.length;
        availableSlots += slots.filter(slot => slot.available).length;
      }
    }

    const occupancyRate = totalSlots > 0 ? ((totalSlots - availableSlots) / totalSlots) * 100 : 0;

    return {
      totalDays,
      activeDays,
      totalSlots,
      availableSlots,
      occupancyRate: Math.round(occupancyRate * 100) / 100
    };

  } catch (error) {
    devError('❌ Erro ao calcular estatísticas:', error);
    return {
      totalDays: 0,
      activeDays: 0,
      totalSlots: 0,
      availableSlots: 0,
      occupancyRate: 0
    };
  }
};