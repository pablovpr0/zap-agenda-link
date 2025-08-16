
import { supabase } from '@/integrations/supabase/client';
import { getTodayInBrazil, getCurrentTimeInBrazil } from '@/utils/timezone';
import { devLog, devError } from '@/utils/console';

export interface TimeSlotConfig {
  workingHoursStart: string;
  workingHoursEnd: string;
  appointmentInterval: number;
  lunchBreakEnabled?: boolean;
  lunchStartTime?: string;
  lunchEndTime?: string;
  serviceDuration?: number;
}

export interface AvailableTimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

/**
 * Obtém configuração de horários para um dia específico da semana
 */
export const getDayScheduleConfig = async (
  companyId: string, 
  date: string
): Promise<TimeSlotConfig | null> => {
  try {
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay(); // 0 = domingo, 1 = segunda, etc.

    devLog(`📅 Buscando configuração para dia ${dayOfWeek} (${date})`);

    // Primeiro, tentar buscar configuração específica do dia em daily_schedules
    const { data: dailySchedule, error: dailyError } = await supabase
      .from('daily_schedules')
      .select('*')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (!dailyError && dailySchedule) {
      devLog(`✅ Configuração específica encontrada para dia ${dayOfWeek}`);
      return {
        workingHoursStart: dailySchedule.start_time.substring(0, 5),
        workingHoursEnd: dailySchedule.end_time.substring(0, 5),
        appointmentInterval: 30, // Padrão
        lunchBreakEnabled: dailySchedule.has_lunch_break,
        lunchStartTime: dailySchedule.lunch_start?.substring(0, 5),
        lunchEndTime: dailySchedule.lunch_end?.substring(0, 5)
      };
    }

    // Fallback: buscar configuração geral em company_settings
    const { data: companySettings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (settingsError || !companySettings) {
      devError('❌ Nenhuma configuração encontrada para a empresa');
      return null;
    }

    // Verificar se a empresa funciona neste dia
    const workingDays = companySettings.working_days || [];
    const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek; // Converter domingo de 0 para 7
    
    if (!workingDays.includes(dayNumber)) {
      devLog(`🚫 Empresa fechada no dia ${dayOfWeek} (${date})`);
      return null;
    }

    devLog(`✅ Usando configuração geral para dia ${dayOfWeek}`);
    return {
      workingHoursStart: companySettings.working_hours_start.substring(0, 5),
      workingHoursEnd: companySettings.working_hours_end.substring(0, 5),
      appointmentInterval: companySettings.appointment_interval,
      lunchBreakEnabled: companySettings.lunch_break_enabled,
      lunchStartTime: companySettings.lunch_start_time?.substring(0, 5),
      lunchEndTime: companySettings.lunch_end_time?.substring(0, 5)
    };

  } catch (error) {
    devError('❌ Erro ao buscar configuração do dia:', error);
    return null;
  }
};

/**
 * Gera todos os horários disponíveis para uma data específica
 */
export const generateAvailableTimeSlots = async (
  companyId: string,
  date: string,
  serviceDuration: number = 60
): Promise<AvailableTimeSlot[]> => {
  try {
    devLog(`🕐 Gerando horários para ${date} (duração: ${serviceDuration}min)`);

    // Obter configuração do dia
    const config = await getDayScheduleConfig(companyId, date);
    if (!config) {
      devLog(`❌ Nenhuma configuração válida para ${date}`);
      return [];
    }

    // Buscar agendamentos existentes para a data
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_time, status, duration')
      .eq('company_id', companyId)
      .eq('appointment_date', date)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      devError('❌ Erro ao buscar agendamentos:', appointmentsError);
      return [];
    }

    // Criar set de horários ocupados
    const occupiedTimes = new Set<string>();
    appointments?.forEach(apt => {
      const timeSlot = apt.appointment_time.substring(0, 5);
      occupiedTimes.add(timeSlot);
      
      // Se o agendamento tem duração maior que 30min, bloquear slots adicionais
      const duration = apt.duration || 60;
      if (duration > 30) {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        
        // Bloquear slots adicionais baseado na duração
        for (let i = 30; i < duration; i += 30) {
          const blockedMinutes = startMinutes + i;
          const blockedHours = Math.floor(blockedMinutes / 60);
          const blockedMins = blockedMinutes % 60;
          const blockedTime = `${blockedHours.toString().padStart(2, '0')}:${blockedMins.toString().padStart(2, '0')}`;
          occupiedTimes.add(blockedTime);
        }
      }
    });

    devLog(`📋 Horários ocupados: [${Array.from(occupiedTimes).join(', ')}]`);

    // Gerar slots disponíveis
    const slots: AvailableTimeSlot[] = [];
    const today = getTodayInBrazil();
    const isToday = date === today;
    const currentTime = isToday ? getCurrentTimeInBrazil() : '00:00';

    // Converter horários para minutos
    const startMinutes = timeToMinutes(config.workingHoursStart);
    const endMinutes = timeToMinutes(config.workingHoursEnd);
    const currentMinutes = timeToMinutes(currentTime);
    const lunchStartMinutes = config.lunchBreakEnabled && config.lunchStartTime ? timeToMinutes(config.lunchStartTime) : null;
    const lunchEndMinutes = config.lunchBreakEnabled && config.lunchEndTime ? timeToMinutes(config.lunchEndTime) : null;

    // Gerar slots de acordo com o intervalo configurado
    for (let minutes = startMinutes; minutes < endMinutes; minutes += config.appointmentInterval) {
      const timeStr = minutesToTime(minutes);
      
      let available = true;
      let reason = '';

      // Verificar se já passou (apenas para hoje, com margem de 30min)
      if (isToday && minutes <= currentMinutes + 30) {
        available = false;
        reason = 'Horário já passou';
      }

      // Verificar intervalo de almoço
      if (available && lunchStartMinutes && lunchEndMinutes) {
        if (minutes >= lunchStartMinutes && minutes < lunchEndMinutes) {
          available = false;
          reason = 'Horário de almoço';
        }
      }

      // Verificar se há tempo suficiente para o serviço
      if (available && minutes + serviceDuration > endMinutes) {
        available = false;
        reason = 'Tempo insuficiente para o serviço';
      }

      // Verificar se há tempo suficiente antes do almoço
      if (available && lunchStartMinutes && lunchEndMinutes) {
        if (minutes < lunchStartMinutes && minutes + serviceDuration > lunchStartMinutes) {
          available = false;
          reason = 'Conflito com horário de almoço';
        }
      }

      // Verificar se está ocupado
      if (available && occupiedTimes.has(timeStr)) {
        available = false;
        reason = 'Horário ocupado';
      }

      slots.push({
        time: timeStr,
        available,
        reason: available ? undefined : reason
      });
    }

    const availableCount = slots.filter(s => s.available).length;
    devLog(`✅ Gerados ${slots.length} slots, ${availableCount} disponíveis`);

    return slots;

  } catch (error) {
    devError('❌ Erro ao gerar horários disponíveis:', error);
    return [];
  }
};

/**
 * Obtém apenas os horários disponíveis (filtrados)
 */
export const getAvailableTimesOnly = async (
  companyId: string,
  date: string,
  serviceDuration: number = 60
): Promise<string[]> => {
  const slots = await generateAvailableTimeSlots(companyId, date, serviceDuration);
  return slots.filter(slot => slot.available).map(slot => slot.time);
};

/**
 * Verifica se um horário específico está disponível
 */
export const isTimeSlotAvailable = async (
  companyId: string,
  date: string,
  time: string,
  serviceDuration: number = 60
): Promise<{ available: boolean; reason?: string }> => {
  try {
    const slots = await generateAvailableTimeSlots(companyId, date, serviceDuration);
    const slot = slots.find(s => s.time === time);
    
    if (!slot) {
      return { available: false, reason: 'Horário fora do funcionamento' };
    }
    
    return { available: slot.available, reason: slot.reason };
  } catch (error) {
    devError('❌ Erro ao verificar disponibilidade:', error);
    return { available: false, reason: 'Erro interno' };
  }
};

// Funções utilitárias
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};
