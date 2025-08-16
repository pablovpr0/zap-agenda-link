
/**
 * Normaliza um número de telefone removendo caracteres especiais e formatação
 * Versão otimizada com cobertura completa para números brasileiros
 */
export const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Validação básica - deve ter pelo menos 10 dígitos
  if (digitsOnly.length < 10) {
    return digitsOnly; // Retorna como está se muito curto
  }
  
  // Se tem 11 dígitos e começa com 0, remove o 0 inicial (formato antigo)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return digitsOnly.substring(1);
  }
  
  // Se tem 13 dígitos e começa com 55 (código do Brasil), remove o 55
  if (digitsOnly.length === 13 && digitsOnly.startsWith('55')) {
    const withoutCountryCode = digitsOnly.substring(2);
    // Se ainda tem 11 dígitos e começa com 0, remove o 0
    if (withoutCountryCode.length === 11 && withoutCountryCode.startsWith('0')) {
      return withoutCountryCode.substring(1);
    }
    return withoutCountryCode;
  }
  
  // Se tem 12 dígitos e começa com 55, remove o 55
  if (digitsOnly.length === 12 && digitsOnly.startsWith('55')) {
    return digitsOnly.substring(2);
  }
  
  // Para números de 10 ou 11 dígitos, retorna direto
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return digitsOnly;
  }
  
  // Para outros casos, retorna os dígitos como estão
  return digitsOnly;
};

/**
 * Verifica se dois números de telefone são equivalentes
 * Versão otimizada com validação mais robusta
 */
export const arePhoneNumbersEqual = (phone1: string, phone2: string): boolean => {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);
  
  // Ambos devem ter pelo menos 10 dígitos e serem iguais
  return normalized1 === normalized2 && normalized1.length >= 10;
};

/**
 * Formata um número de telefone para exibição
 * Mantém formatação brasileira padrão
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

/**
 * Valida se um telefone está em formato válido brasileiro
 */
export const isValidBrazilianPhone = (phone: string): boolean => {
  const normalized = normalizePhone(phone);
  
  // Deve ter 10 ou 11 dígitos
  if (normalized.length !== 10 && normalized.length !== 11) {
    return false;
  }
  
  // Primeiros dois dígitos devem formar um DDD válido (11-99)
  const ddd = parseInt(normalized.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  // Se tem 11 dígitos, o 3º dígito deve ser 9 (celular)
  if (normalized.length === 11) {
    const thirdDigit = normalized.charAt(2);
    if (thirdDigit !== '9') {
      return false;
    }
  }
  
  return true;
};
