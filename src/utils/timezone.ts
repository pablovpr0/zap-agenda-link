
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

// Timezone padrão do Brasil
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma data local para UTC considerando o timezone do Brasil
 */
export const convertToUTC = (date: Date): Date => {
  return fromZonedTime(date, BRAZIL_TIMEZONE);
};

/**
 * Converte uma data UTC para o timezone do Brasil
 */
export const convertFromUTC = (date: Date): Date => {
  return toZonedTime(date, BRAZIL_TIMEZONE);
};

/**
 * Formata uma data no timezone do Brasil
 */
export const formatInBrazilTimezone = (
  date: Date, 
  formatString: string = 'dd/MM/yyyy HH:mm'
): string => {
  const brasiliaDate = toZonedTime(date, BRAZIL_TIMEZONE);
  return format(brasiliaDate, formatString, { 
    timeZone: BRAZIL_TIMEZONE,
    locale: ptBR 
  });
};

/**
 * Obtém a data atual no timezone do Brasil
 */
export const getCurrentBrazilTime = (): Date => {
  return toZonedTime(new Date(), BRAZIL_TIMEZONE);
};

/**
 * Cria uma data específica no timezone do Brasil
 */
export const createBrazilDate = (year: number, month: number, day: number, hour: number = 0, minute: number = 0): Date => {
  const localDate = new Date(year, month, day, hour, minute);
  return convertToUTC(localDate);
};

/**
 * Verifica se uma data está no timezone do Brasil
 */
export const isBrazilTimezone = (date: Date): boolean => {
  const offset = date.getTimezoneOffset();
  const brazilDate = toZonedTime(date, BRAZIL_TIMEZONE);
  const brazilOffset = brazilDate.getTimezoneOffset();
  return offset === brazilOffset;
};

// Aliases para compatibilidade com o código existente
export const getNowInBrazil = getCurrentBrazilTime;
export const formatToBrasilia = formatInBrazilTimezone;

/**
 * Obtém a data de hoje no formato YYYY-MM-DD no timezone do Brasil
 */
export const getTodayInBrazil = (): string => {
  return formatInBrazilTimezone(new Date(), 'yyyy-MM-dd');
};

/**
 * Obtém o horário atual no formato HH:mm no timezone do Brasil
 */
export const getCurrentTimeInBrazil = (): string => {
  return formatInBrazilTimezone(new Date(), 'HH:mm');
};

/**
 * Converte data/hora do Brasil para UTC (para salvar no banco)
 */
export const brazilDateTimeToUtc = (date: string, time: string): Date => {
  const dateTime = new Date(`${date}T${time}:00`);
  return fromZonedTime(dateTime, BRAZIL_TIMEZONE);
};

/**
 * Formata timestamp do banco para exibição no Brasil
 */
export const formatDatabaseTimestamp = (timestamp: string): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return formatInBrazilTimezone(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Verifica se uma data/hora está no passado considerando o timezone do Brasil
 */
export const isDateTimePastInBrazil = (date: string, time?: string): boolean => {
  const now = getCurrentBrazilTime();
  const checkDate = time ? new Date(`${date}T${time}:00`) : new Date(`${date}T00:00:00`);
  const brazilCheckDate = toZonedTime(checkDate, BRAZIL_TIMEZONE);
  return brazilCheckDate < now;
};

/**
 * Formata horário UTC para horário do Brasil
 */
export const formatUtcToBrazilTime = (utcTimestamp: string): string => {
  if (!utcTimestamp) return '';
  const utcDate = new Date(utcTimestamp);
  return formatInBrazilTimezone(utcDate, 'HH:mm');
};

/**
 * Debug do timezone para desenvolvimento
 */
export const debugTimezone = () => {
  const now = new Date();
  const brazilTime = getCurrentBrazilTime();
  const today = getTodayInBrazil();
  const currentTime = getCurrentTimeInBrazil();
  
  console.log('🌍 Timezone Debug:', {
    utcNow: now.toISOString(),
    brazilTime: brazilTime.toISOString(),
    todayBrazil: today,
    currentTimeBrazil: currentTime,
    timezone: BRAZIL_TIMEZONE
  });
};
