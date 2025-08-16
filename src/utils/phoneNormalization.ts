export const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  
  let digitsOnly = phone.replace(/\D/g, '');
  
  // Remove prefixos comuns
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    digitsOnly = digitsOnly.substring(1);
  } else if ((digitsOnly.length === 13 || digitsOnly.length === 12) && digitsOnly.startsWith('55')) {
    digitsOnly = digitsOnly.substring(2);
  }
  
  // CORREÇÃO: O banco adiciona automaticamente o código 55 do Brasil
  // Então precisamos garantir que sempre retornemos no formato esperado pelo banco
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return '55' + digitsOnly;
  }
  
  return digitsOnly;
};

export const arePhoneNumbersEqual = (phone1: string, phone2: string): boolean => {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);
  return normalized1 === normalized2 && normalized1.length >= 10;
};

export const formatPhoneForDisplay = (phone: string): string => {
  const normalized = normalizePhone(phone);
  
  if (normalized.length === 10) {
    return `(${normalized.substring(0, 2)}) ${normalized.substring(2, 6)}-${normalized.substring(6)}`;
  } else if (normalized.length === 11) {
    return `(${normalized.substring(0, 2)}) ${normalized.substring(2, 7)}-${normalized.substring(7)}`;
  }
  
  return phone;
};