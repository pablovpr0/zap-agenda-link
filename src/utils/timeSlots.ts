import { getTodayInBrazil, getCurrentTimeInBrazil, isDateTimePastInBrazil } from './timezone';
import { format } from 'date-fns-tz';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

export interface TimeSlotConfig {
  workingHoursStart: string; // HH:mm
  workingHoursEnd: string;   // HH:mm
  appointmentInterval: number; // minutes
  lunchBreakEnabled?: boolean;
  lunchStartTime?: string;   // HH:mm
  lunchEndTime?: string;     // HH:mm
  serviceDuration?: number;  // minutes
}

/**
 * Gera horários disponíveis considerando timezone do Brasil
 */
export const generateAvailableTimeSlots = (
  date: string, // YYYY-MM-DD
  config: TimeSlotConfig,
  bookedTimes: string[] = []
): string[] => {
  const {
    workingHoursStart,
    workingHoursEnd,
    appointmentInterval,
    lunchBreakEnabled = false,
    lunchStartTime = '12:00',
    lunchEndTime = '13:00',
    serviceDuration = 60
  } = config;

  devLog('🕐 Generating time slots for Brazil timezone:', {
    date,
    config,
    bookedTimes: bookedTimes.length
  });

  const timeSlots: string[] = [];
  const today = getTodayInBrazil();
  const isToday = date === today;
  const currentTime = isToday ? getCurrentTimeInBrazil() : '00:00';

  // Converter horários para minutos para facilitar cálculos
  const startMinutes = timeToMinutes(workingHoursStart);
  const endMinutes = timeToMinutes(workingHoursEnd);
  const lunchStartMinutes = lunchBreakEnabled ? timeToMinutes(lunchStartTime) : null;
  const lunchEndMinutes = lunchBreakEnabled ? timeToMinutes(lunchEndTime) : null;
  const currentMinutes = timeToMinutes(currentTime);

  // Gerar slots de tempo
  for (let minutes = startMinutes; minutes < endMinutes; minutes += appointmentInterval) {
    const timeStr = minutesToTime(minutes);
    
    // Verificar se o horário já passou (apenas para hoje)
    if (isToday && minutes <= currentMinutes + 30) { // 30min de antecedência mínima
      continue;
    }

    // Verificar se está no horário de almoço
    if (lunchBreakEnabled && lunchStartMinutes && lunchEndMinutes) {
      if (minutes >= lunchStartMinutes && minutes < lunchEndMinutes) {
        continue;
      }
    }

    // Verificar se há tempo suficiente para o serviço antes do fim do expediente
    if (minutes + serviceDuration > endMinutes) {
      continue;
    }

    // Verificar se há tempo suficiente antes do almoço (se aplicável)
    if (lunchBreakEnabled && lunchStartMinutes && lunchEndMinutes) {
      if (minutes < lunchStartMinutes && minutes + serviceDuration > lunchStartMinutes) {
        continue;
      }
    }

    // Verificar se o horário não está ocupado
    if (!bookedTimes.includes(timeStr)) {
      timeSlots.push(timeStr);
    }
  }

  devLog('✅ Generated time slots:', {
    date,
    isToday,
    currentTime,
    totalSlots: timeSlots.length,
    slots: timeSlots
  });

  return timeSlots;
};

/**
 * Converte string de horário (HH:mm) para minutos
 */
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converte minutos para string de horário (HH:mm)
 */
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Verifica se um horário específico está disponível
 */
export const isTimeSlotAvailable = (
  date: string,
  time: string,
  config: TimeSlotConfig,
  bookedTimes: string[] = []
): boolean => {
  const availableSlots = generateAvailableTimeSlots(date, config, bookedTimes);
  return availableSlots.includes(time);
};

/**
 * Obtém próximos horários disponíveis
 */
export const getNextAvailableSlots = (
  startDate: string,
  config: TimeSlotConfig,
  bookedTimesByDate: Record<string, string[]> = {},
  daysToCheck: number = 7
): Array<{ date: string; time: string }> => {
  const nextSlots: Array<{ date: string; time: string }> = [];
  const today = getTodayInBrazil();
  
  for (let i = 0; i < daysToCheck; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + i);
    // Usar formatação com timezone brasileiro
    const dateStr = format(checkDate, 'yyyy-MM-dd', { timeZone: 'America/Sao_Paulo' });
    
    // Pular datas passadas
    if (dateStr < today) continue;
    
    const bookedTimes = bookedTimesByDate[dateStr] || [];
    const availableSlots = generateAvailableTimeSlots(dateStr, config, bookedTimes);
    
    // Adicionar primeiros slots disponíveis do dia
    availableSlots.slice(0, 3).forEach(time => {
      nextSlots.push({ date: dateStr, time });
    });
    
    // Parar se já temos slots suficientes
    if (nextSlots.length >= 10) break;
  }
  
  return nextSlots;
};