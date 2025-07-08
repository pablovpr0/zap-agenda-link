
import { ptBR } from 'date-fns/locale';

// Configuração padrão para datas em português brasileiro
export const dateLocale = ptBR;

// Timezone de Brasília
export const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

// Função para obter data atual no horário de Brasília
export const getBrasiliaDate = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BRASILIA_TIMEZONE }));
};

// Função para formatar data no padrão brasileiro
export const formatBrazilianDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Função para formatar horário no padrão brasileiro
export const formatBrazilianTime = (date: Date) => {
  return date.toLocaleTimeString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
};
