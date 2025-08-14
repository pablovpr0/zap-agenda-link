
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

// Timezone padrão do Brasil
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma data local para UTC considerando o timezone do Brasil
 */
export const convertToUTC = (date: Date): Date => {
  return zonedTimeToUtc(date, BRAZIL_TIMEZONE);
};

/**
 * Converte uma data UTC para o timezone do Brasil
 */
export const convertFromUTC = (date: Date): Date => {
  return utcToZonedTime(date, BRAZIL_TIMEZONE);
};

/**
 * Formata uma data no timezone do Brasil
 */
export const formatInBrazilTimezone = (
  date: Date, 
  formatString: string = 'dd/MM/yyyy HH:mm'
): string => {
  const brasiliaDate = utcToZonedTime(date, BRAZIL_TIMEZONE);
  return format(brasiliaDate, formatString, { 
    timeZone: BRAZIL_TIMEZONE,
    locale: ptBR 
  });
};

/**
 * Obtém a data atual no timezone do Brasil
 */
export const getCurrentBrazilTime = (): Date => {
  return utcToZonedTime(new Date(), BRAZIL_TIMEZONE);
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
  const brazilDate = utcToZonedTime(date, BRAZIL_TIMEZONE);
  const brazilOffset = brazilDate.getTimezoneOffset();
  return offset === brazilOffset;
};
