import { z } from 'zod';
import { devLog, devError } from '@/utils/console';

// Schemas de validação com Zod
export const phoneSchema = z.string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone deve ter no máximo 15 dígitos')
  .regex(/^[\d\s()+-]+$/, 'Formato de telefone inválido')
  .transform(phone => phone.replace(/\D/g, '')) // Remove caracteres não numéricos
  .refine(phone => {
    // Validação específica para telefones brasileiros
    if (phone.length === 10 || phone.length === 11) {
      const ddd = parseInt(phone.substring(0, 2));
      return ddd >= 11 && ddd <= 99;
    }
    return false;
  }, 'DDD inválido para telefone brasileiro');

export const emailSchema = z.string()
  .email('Email inválido')
  .max(254, 'Email muito longo')
  .transform(email => email.toLowerCase().trim());

export const nameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .regex(/^[a-zA-ZÀ-ÿ\s\-.']+$/, 'Nome contém caracteres inválidos')
  .transform(name => name.trim().replace(/\s+/g, ' '));

export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)')
  .refine(dateStr => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'Data não pode ser no passado');

export const timeSchema = z.string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário inválido (HH:MM)');

// Schema para dados de agendamento
export const bookingFormSchema = z.object({
  clientName: nameSchema,
  clientPhone: phoneSchema,
  clientEmail: emailSchema.optional().or(z.literal('')),
  selectedDate: dateSchema,
  selectedTime: timeSchema,
  selectedService: z.string().uuid('ID do serviço inválido'),
  selectedProfessional: z.string().uuid('ID do profissional inválido').optional(),
  notes: z.string().max(500, 'Observações muito longas').optional()
});

// Schema para configurações da empresa
export const companySettingsSchema = z.object({
  max_bookings_per_client: z.number().int().min(1).max(10),
  booking_days_limit: z.number().int().min(1).max(365),
  slot_interval_minutes: z.number().int().min(15).max(120),
  advance_booking_limit: z.number().int().min(1).max(365),
  same_day_booking: z.boolean(),
  auto_confirm_bookings: z.boolean(),
  require_client_email: z.boolean(),
  opening_hours: z.record(z.object({
    open: timeSchema,
    close: timeSchema,
    active: z.boolean()
  })).refine(hours => {
    // Validar se horário de abertura é antes do fechamento
    return Object.values(hours).every(day => {
      if (!day.active) return true;
      const [openHour, openMin] = day.open.split(':').map(Number);
      const [closeHour, closeMin] = day.close.split(':').map(Number);
      const openTime = openHour * 60 + openMin;
      const closeTime = closeHour * 60 + closeMin;
      return openTime < closeTime;
    });
  }, 'Horário de abertura deve ser antes do fechamento'),
  lunch_break: z.object({
    start: timeSchema,
    end: timeSchema,
    active: z.boolean()
  }).refine(lunch => {
    if (!lunch.active) return true;
    const [startHour, startMin] = lunch.start.split(':').map(Number);
    const [endHour, endMin] = lunch.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    return startTime < endTime;
  }, 'Horário de início do almoço deve ser antes do fim'),
  booking_confirmation_message: z.string().max(500).optional(),
  cancellation_policy: z.string().max(1000).optional()
});

// Tipos TypeScript derivados dos schemas
export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type CompanySettingsData = z.infer<typeof companySettingsSchema>;

// Classe para validação avançada
export class AdvancedValidator {
  private static instance: AdvancedValidator;
  private validationCache = new Map<string, { result: unknown; timestamp: number }>();
  private readonly CACHE_TTL = 60000; // 1 minuto

  static getInstance(): AdvancedValidator {
    if (!AdvancedValidator.instance) {
      AdvancedValidator.instance = new AdvancedValidator();
    }
    return AdvancedValidator.instance;
  }

  /**
   * Valida dados com cache para performance
   */
  async validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    cacheKey?: string
  ): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
    try {
      // Verificar cache se fornecido
      if (cacheKey) {
        const cached = this.validationCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          devLog(`✅ Validation CACHE HIT: ${cacheKey}`);
          return cached.result;
        }
      }

      const result = await schema.parseAsync(data);
      
      const successResult = { success: true as const, data: result };
      
      // Salvar no cache
      if (cacheKey) {
        this.validationCache.set(cacheKey, {
          result: successResult,
          timestamp: Date.now()
        });
      }

      devLog('✅ Validation SUCCESS');
      return successResult;

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });

        const errorResult = { success: false as const, errors };
        
        devError('❌ Validation FAILED:', errors);
        return errorResult;
      }

      devError('❌ Validation ERROR:', error);
      return { success: false, errors: ['Erro interno de validação'] };
    }
  }

  /**
   * Validação específica para telefone brasileiro
   */
  validateBrazilianPhone(phone: string): {
    isValid: boolean;
    formatted: string;
    errors: string[];
  } {
    const errors: string[] = [];
    let formatted = phone.replace(/\D/g, '');

    // Remover código do país se presente
    if (formatted.startsWith('55') && formatted.length > 11) {
      formatted = formatted.substring(2);
    }

    // Validar comprimento
    if (formatted.length < 10 || formatted.length > 11) {
      errors.push('Telefone deve ter 10 ou 11 dígitos');
    }

    // Validar DDD
    if (formatted.length >= 2) {
      const ddd = parseInt(formatted.substring(0, 2));
      if (ddd < 11 || ddd > 99) {
        errors.push('DDD inválido');
      }
    }

    // Validar nono dígito para celulares
    if (formatted.length === 11 && formatted[2] !== '9') {
      errors.push('Celular deve começar com 9 após o DDD');
    }

    // Formatar para exibição
    let displayFormat = formatted;
    if (formatted.length === 10) {
      displayFormat = `(${formatted.substring(0, 2)}) ${formatted.substring(2, 6)}-${formatted.substring(6)}`;
    } else if (formatted.length === 11) {
      displayFormat = `(${formatted.substring(0, 2)}) ${formatted.substring(2, 7)}-${formatted.substring(7)}`;
    }

    return {
      isValid: errors.length === 0,
      formatted: displayFormat,
      errors
    };
  }

  /**
   * Validação de horário de funcionamento
   */
  validateBusinessHours(
    openTime: string,
    closeTime: string,
    lunchStart?: string,
    lunchEnd?: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Converter para minutos para comparação
      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const open = timeToMinutes(openTime);
      const close = timeToMinutes(closeTime);

      // Validar horário básico
      if (open >= close) {
        errors.push('Horário de abertura deve ser antes do fechamento');
      }

      // Validar horário de almoço se fornecido
      if (lunchStart && lunchEnd) {
        const lunchStartMin = timeToMinutes(lunchStart);
        const lunchEndMin = timeToMinutes(lunchEnd);

        if (lunchStartMin >= lunchEndMin) {
          errors.push('Horário de início do almoço deve ser antes do fim');
        }

        if (lunchStartMin <= open || lunchEndMin >= close) {
          errors.push('Horário de almoço deve estar dentro do horário de funcionamento');
        }
      }

    } catch (error) {
      errors.push('Formato de horário inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Limpa cache de validação
   */
  clearCache(): void {
    this.validationCache.clear();
    devLog('🧹 Validation cache cleared');
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    this.validationCache.forEach(item => {
      if (now - item.timestamp > this.CACHE_TTL) {
        expired++;
      } else {
        active++;
      }
    });

    return { total: this.validationCache.size, active, expired };
  }
}

// Instância singleton
export const validator = AdvancedValidator.getInstance();

// Funções utilitárias para validação rápida
export const validateBookingForm = (data: unknown) =>
  validator.validate(bookingFormSchema, data, `booking_${JSON.stringify(data)}`);

export const validateCompanySettings = (data: unknown) =>
  validator.validate(companySettingsSchema, data, `settings_${JSON.stringify(data)}`);

export const validatePhone = (phone: string) =>
  validator.validateBrazilianPhone(phone);

export const validateBusinessHours = (
  openTime: string,
  closeTime: string,
  lunchStart?: string,
  lunchEnd?: string
) => validator.validateBusinessHours(openTime, closeTime, lunchStart, lunchEnd);

export default validator;