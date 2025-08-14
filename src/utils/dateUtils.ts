
import { format, parse, isValid, startOfDay, endOfDay, addDays, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { formatToBrasilia, getNowInBrazil } from './timezone';
import { ptBR } from 'date-fns/locale';

export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  return formatToBrasilia(dateObj, 'dd/MM/yyyy');
};

export const formatTimeForDisplay = (time: string): string => {
  if (!time) return '';
  return time;
};

export const formatDateTimeForDisplay = (date: Date | string, time?: string): string => {
  const dateStr = formatDateForDisplay(date);
  if (!time) return dateStr;
  return `${dateStr} às ${time}`;
};

export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  try {
    // Try parsing DD/MM/YYYY format first
    if (dateStr.includes('/')) {
      const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) return parsed;
    }
    
    // Try parsing ISO format
    const isoDate = new Date(dateStr);
    if (isValid(isoDate)) return isoDate;
    
    return null;
  } catch {
    return null;
  }
};

export const formatDateForInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  return formatToBrasilia(dateObj, 'yyyy-MM-dd');
};

export const getCurrentBrasiliaDate = (): Date => {
  return getNowInBrazil();
};

export const isDateInPast = (date: Date | string, compareToNow = true): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return false;
  
  const compareDate = compareToNow ? getCurrentBrasiliaDate() : new Date();
  return startOfDay(dateObj) < startOfDay(compareDate);
};

export const isDateToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return false;
  
  return isSameDay(dateObj, getCurrentBrasiliaDate());
};

export const addDaysToDate = (date: Date | string, days: number): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return addDays(dateObj, days);
};

export const subtractDaysFromDate = (date: Date | string, days: number): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return subDays(dateObj, days);
};

export const getMonthDateRange = (date: Date | string): { start: Date; end: Date } => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return {
    start: startOfMonth(dateObj),
    end: endOfMonth(dateObj)
  };
};

export const getDaysInMonth = (date: Date | string): Date[] => {
  const { start, end } = getMonthDateRange(date);
  return eachDayOfInterval({ start, end });
};

export const formatMonthYear = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  return formatToBrasilia(dateObj, 'MMMM yyyy');
};

// Funções específicas para o sistema de agendamento
export const generateAvailableDates = (workingDays: number[], advanceBookingLimit: number): Date[] => {
  const dates: Date[] = [];
  const today = getCurrentBrasiliaDate();
  const maxDate = addDays(today, advanceBookingLimit);
  
  let currentDate = today;
  while (currentDate <= maxDate) {
    if (workingDays.includes(currentDate.getDay())) {
      dates.push(currentDate);
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
};

export const generateTimeSlots = (startTime: string, endTime: string, interval: number): string[] => {
  const slots: string[] = [];
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  
  let current = start;
  while (current < end) {
    slots.push(current.toTimeString().substr(0, 5));
    current = new Date(current.getTime() + interval * 60 * 1000);
  }
  
  return slots;
};

export const formatAppointmentDateWithWeekday = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  return formatToBrasilia(dateObj, "EEEE, dd 'de' MMMM");
};

/**
 * Formata data no padrão brasileiro (dd/mm/aaaa)
 */
export const formatBrazilianDate = (date: Date | string): string => {
  return formatDateForDisplay(date);
};

/**
 * Formata horário no padrão brasileiro (24 horas)
 */
export const formatBrazilianTime = (time: string): string => {
  if (!time) return '';
  // Garantir formato HH:mm
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

/**
 * Formata data e hora completas no padrão brasileiro
 */
export const formatBrazilianDateTime = (date: Date | string, time?: string): string => {
  const dateStr = formatBrazilianDate(date);
  if (!time) return dateStr;
  return `${dateStr} às ${formatBrazilianTime(time)}`;
};
