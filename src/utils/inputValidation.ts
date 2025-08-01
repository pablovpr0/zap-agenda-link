
// Comprehensive input validation and sanitization utilities

export const sanitizeText = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets to prevent basic XSS
    .replace(/\s+/g, ' '); // Normalize whitespace
};

export const validateName = (name: string): { isValid: boolean; error?: string; sanitized?: string } => {
  if (!name) {
    return { isValid: false, error: 'Nome é obrigatório' };
  }
  
  const sanitized = sanitizeText(name);
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Nome deve ter no máximo 100 caracteres' };
  }
  
  // Check for invalid characters (only letters, spaces, and basic punctuation)
  if (!/^[a-zA-ZÀ-ÿ\s\-.']+$/.test(sanitized)) {
    return { isValid: false, error: 'Nome contém caracteres não permitidos' };
  }
  
  return { isValid: true, sanitized };
};

export const validatePhone = (phone: string): { isValid: boolean; error?: string; sanitized?: string } => {
  if (!phone) {
    return { isValid: false, error: 'Telefone é obrigatório' };
  }
  
  // Remove all non-digit characters except + and ()
  const sanitized = phone.replace(/[^0-9+()-]/g, '');
  
  if (sanitized.length < 10) {
    return { isValid: false, error: 'Telefone deve ter pelo menos 10 dígitos' };
  }
  
  if (sanitized.length > 20) {
    return { isValid: false, error: 'Telefone deve ter no máximo 20 dígitos' };
  }
  
  return { isValid: true, sanitized };
};

export const validateEmail = (email: string): { isValid: boolean; error?: string; sanitized?: string } => {
  if (!email) {
    return { isValid: true, sanitized: '' }; // Email is optional
  }
  
  const sanitized = sanitizeText(email).toLowerCase();
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email muito longo' };
  }
  
  return { isValid: true, sanitized };
};

export const validateDate = (date: string): { isValid: boolean; error?: string } => {
  if (!date) {
    return { isValid: false, error: 'Data é obrigatória' };
  }
  
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return { isValid: false, error: 'Não é possível agendar para datas passadas' };
  }
  
  // Don't allow scheduling too far in the future (1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (selectedDate > oneYearFromNow) {
    return { isValid: false, error: 'Data muito distante no futuro' };
  }
  
  return { isValid: true };
};

export const validateTime = (time: string): { isValid: boolean; error?: string } => {
  if (!time) {
    return { isValid: false, error: 'Horário é obrigatório' };
  }
  
  // Check time format HH:MM
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(time)) {
    return { isValid: false, error: 'Formato de horário inválido' };
  }
  
  return { isValid: true };
};

export const validateBookingForm = (formData: {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  selectedDate: string;
  selectedTime: string;
  selectedService: string;
  selectedProfessional?: string;
}): { isValid: boolean; errors: string[]; sanitizedData?: any } => {
  const errors: string[] = [];
  const sanitizedData: any = {};
  
  // Validate name
  const nameValidation = validateName(formData.clientName);
  if (!nameValidation.isValid) {
    errors.push(nameValidation.error!);
  } else {
    sanitizedData.clientName = nameValidation.sanitized;
  }
  
  // Validate phone
  const phoneValidation = validatePhone(formData.clientPhone);
  if (!phoneValidation.isValid) {
    errors.push(phoneValidation.error!);
  } else {
    sanitizedData.clientPhone = phoneValidation.sanitized;
  }
  
  // Validate email (optional)
  if (formData.clientEmail) {
    const emailValidation = validateEmail(formData.clientEmail);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.error!);
    } else {
      sanitizedData.clientEmail = emailValidation.sanitized;
    }
  }
  
  // Validate date
  const dateValidation = validateDate(formData.selectedDate);
  if (!dateValidation.isValid) {
    errors.push(dateValidation.error!);
  } else {
    sanitizedData.selectedDate = formData.selectedDate;
  }
  
  // Validate time
  const timeValidation = validateTime(formData.selectedTime);
  if (!timeValidation.isValid) {
    errors.push(timeValidation.error!);
  } else {
    sanitizedData.selectedTime = formData.selectedTime;
  }
  
  // Validate service selection
  if (!formData.selectedService) {
    errors.push('Serviço deve ser selecionado');
  } else {
    sanitizedData.selectedService = formData.selectedService;
    sanitizedData.selectedProfessional = formData.selectedProfessional;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  };
};
