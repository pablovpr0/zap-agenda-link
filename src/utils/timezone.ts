
import { parseISO, format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

// Timezone oficial do Brasil
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
  return format(date, formatString, { timeZone: BRAZIL_TIMEZONE, locale: ptBR });
};

/**
 * Função utilitária principal para formatação de datas no Brasil
 * Esta deve ser usada em todo o frontend para exibir datas
 */
export const formatToBrasilia = (
  date: Date | string,
  formatString: string = 'dd/MM/yyyy HH:mm'
): string => {
  return formatUtcToBrazilTime(date, formatString);
};

/**
 * Converte dados do banco (UTC) para exibição no Brasil
 * Usar esta função ao receber dados de appointments, etc.
 */
export const convertDatabaseDateToBrasilia = (
  utcDate: string,
  formatString: string = 'dd/MM/yyyy HH:mm'
): string => {
  return formatUtcToBrazilTime(utcDate, formatString);
};

/**
 * Converte entrada do usuário (Brasil) para UTC antes de salvar no banco
 */
export const convertBrasiliaToDatabase = (dateStr: string, timeStr: string): string => {
  const utcDate = brazilDateTimeToUtc(dateStr, timeStr);
  return utcDate.toISOString();
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
  return format(now, 'yyyy-MM-dd', { timeZone: BRAZIL_TIMEZONE });
};

/**
 * Obtém o horário atual no horário de Brasília formatado como string (HH:mm)
 */
export const getCurrentTimeInBrazil = (): string => {
  const now = getNowInBrazil();
  return format(now, 'HH:mm', { timeZone: BRAZIL_TIMEZONE });
};

/**
 * Converte uma string de data (YYYY-MM-DD) e hora (HH:mm) do Brasil para UTC
 */
export const brazilDateTimeToUtc = (dateStr: string, timeStr: string): Date => {
  // Criar data no horário de Brasília
  const brazilDateTime = new Date(`${dateStr}T${timeStr}:00`);
  return fromZonedTime(brazilDateTime, BRAZIL_TIMEZONE);
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
    const today = format(now, 'yyyy-MM-dd', { timeZone: BRAZIL_TIMEZONE });
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
 * Formata valores monetários no padrão brasileiro
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata números no padrão brasileiro
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

/**
 * Debug: Mostra comparação de horários
 */
export const debugTimezone = () => {
  const now = new Date();
  const brazilTime = getNowInBrazil();

  devLog('🕐 Debug Timezone:', {
    utc: now.toISOString(),
    brazil: format(brazilTime, 'yyyy-MM-dd HH:mm:ss', { timeZone: BRAZIL_TIMEZONE }),
    utc_formatted: formatDate(now, 'yyyy-MM-dd HH:mm:ss'),
    brazil_formatted: format(brazilTime, 'yyyy-MM-dd HH:mm:ss', { timeZone: BRAZIL_TIMEZONE }),
    timezone: BRAZIL_TIMEZONE
  });
};
