import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime, formatInTimeZone, fromZonedTime } from 'date-fns-tz';
// Timezone do Brasil
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma data UTC para o horário de Brasília
 */
export const utcToBrazilTime = (utcDate: Date | string): Date => {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return toZonedTime(date, BRAZIL_TIMEZONE);
};

/**
 * Converte uma data do horário de Brasília para UTC
 */
export const brazilTimeToUtc = (brazilDate: Date): Date => {
  return fromZonedTime(brazilDate, BRAZIL_TIMEZONE);
};

/**
 * Formata uma data UTC para exibição no horário de Brasília
 */
export const formatUtcToBrazilTime = (
  utcDate: Date | string, 
  formatString: string = 'dd/MM/yyyy HH:mm'
): string => {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return formatInTimeZone(date, BRAZIL_TIMEZONE, formatString, { locale: ptBR });
};

/**
 * Obtém a data atual no horário de Brasília
 */
export const getNowInBrazil = (): Date => {
  return toZonedTime(new Date(), BRAZIL_TIMEZONE);
};

/**
 * Obtém a data atual no horário de Brasília formatada como string ISO (YYYY-MM-DD)
 */
export const getTodayInBrazil = (): string => {
  const now = getNowInBrazil();
  return format(now, 'yyyy-MM-dd');
};

/**
 * Obtém o horário atual no horário de Brasília formatado como string (HH:mm)
 */
export const getCurrentTimeInBrazil = (): string => {
  const now = getNowInBrazil();
  return format(now, 'HH:mm');
};

/**
 * Converte uma string de data (YYYY-MM-DD) e hora (HH:mm) do Brasil para UTC
 */
export const brazilDateTimeToUtc = (dateStr: string, timeStr: string): Date => {
  // Criar data no horário de Brasília
  const brazilDateTime = new Date(`${dateStr}T${timeStr}:00`);
  return brazilTimeToUtc(brazilDateTime);
};

/**
 * Verifica se uma data/hora já passou no horário de Brasília
 */
export const isDateTimePastInBrazil = (dateStr: string, timeStr?: string): boolean => {
  const now = getNowInBrazil();
  const targetDate = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
  
  if (timeStr) {
    return targetDate < now;
  } else {
    // Se não tem horário, compara apenas a data
    const today = format(now, 'yyyy-MM-dd');
    return dateStr < today;
  }
};

/**
 * Formata timestamp do banco (UTC) para exibição no Brasil
 */
export const formatDatabaseTimestamp = (
  timestamp: string, 
  formatString: string = 'dd/MM/yyyy HH:mm'
): string => {
  return formatUtcToBrazilTime(timestamp, formatString);
};

/**
 * Converte horário de trabalho (string HH:mm) considerando timezone
 */
export const convertWorkingHours = (timeStr: string): string => {
  // Para horários de trabalho, não precisamos converter timezone
  // pois são horários locais da empresa
  return timeStr;
};

/**
 * Debug: Mostra comparação de horários
 */
export const debugTimezone = () => {
  const now = new Date();
  const brazilTime = getNowInBrazil();
  
  console.log('🕐 Debug Timezone:', {
    utc: now.toISOString(),
    brazil: format(brazilTime, 'yyyy-MM-dd HH:mm:ss'),
    utc_formatted: format(now, 'yyyy-MM-dd HH:mm:ss'),
    brazil_formatted: format(brazilTime, 'yyyy-MM-dd HH:mm:ss'),
    timezone: BRAZIL_TIMEZONE
  });
};