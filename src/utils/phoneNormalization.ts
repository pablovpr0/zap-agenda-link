/**
 * Normaliza um número de telefone removendo caracteres especiais e formatação
 * Mantém apenas os dígitos para comparação
 */
export const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Se tem 11 dígitos e começa com 0, remove o 0 inicial (formato antigo)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return digitsOnly.substring(1);
  }
  
  // Se tem 10 dígitos, é um número válido
  if (digitsOnly.length === 10) {
    return digitsOnly;
  }
  
  // Se tem 11 dígitos e não começa com 0, é um número com 9º dígito
  if (digitsOnly.length === 11) {
    return digitsOnly;
  }
  
  // Se tem 13 dígitos e começa com 55 (código do Brasil), remove o 55
  if (digitsOnly.length === 13 && digitsOnly.startsWith('55')) {
    return digitsOnly.substring(2);
  }
  
  // Se tem 12 dígitos e começa com 55, remove o 55
  if (digitsOnly.length === 12 && digitsOnly.startsWith('55')) {
    return digitsOnly.substring(2);
  }
  
  // Retorna os dígitos como estão se não se encaixar nos padrões acima
  return digitsOnly;
};

/**
 * Verifica se dois números de telefone são equivalentes
 */
export const arePhoneNumbersEqual = (phone1: string, phone2: string): boolean => {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);
  
  return normalized1 === normalized2 && normalized1.length >= 10;
};

/**
 * Formata um número de telefone para exibição
 */
export const formatPhoneForDisplay = (phone: string): string => {
  const normalized = normalizePhone(phone);
  
  if (normalized.length === 10) {
    // Formato: (11) 1234-5678
    return `(${normalized.substring(0, 2)}) ${normalized.substring(2, 6)}-${normalized.substring(6)}`;
  } else if (normalized.length === 11) {
    // Formato: (11) 91234-5678
    return `(${normalized.substring(0, 2)}) ${normalized.substring(2, 7)}-${normalized.substring(7)}`;
  }
  
  // Se não conseguir formatar, retorna o original
  return phone;
};