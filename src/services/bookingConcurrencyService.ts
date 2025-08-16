import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from '@/utils/console';
import { normalizePhone } from '@/utils/phoneNormalization';

export interface BookingLimitCheck {
  can_book: boolean;
  current_count: number;
  max_allowed: number;
  message: string;
}

export interface SlotAvailabilityCheck {
  is_available: boolean;
  conflicting_appointments: number;
  message: string;
}

export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
  clientLimits?: BookingLimitCheck;
  slotAvailability?: SlotAvailabilityCheck;
}

/**
 * Verifica se um cliente pode fazer um novo agendamento
 */
export const checkClientBookingLimit = async (
  companyId: string,
  clientPhone: string,
  excludeAppointmentId?: string
): Promise<BookingLimitCheck | null> => {
  try {
    devLog('🔍 Verificando limite de agendamentos para cliente:', { companyId, clientPhone });
    
    // CORREÇÃO: Implementar verificação direta sem RPC
    
    // 1. Buscar configurações da empresa para pegar o limite
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('max_simultaneous_appointments')
      .eq('company_id', companyId)
      .single();

    if (settingsError) throw settingsError;
    
    const maxAllowed = settings?.max_simultaneous_appointments || 3;

    // 2. Buscar cliente pelo telefone
    const { findClientByPhone } = await import('./clientService');
    const client = await findClientByPhone(companyId, clientPhone);
    
    if (!client) {
      // Cliente novo, pode agendar
      return {
        can_book: true,
        current_count: 0,
        max_allowed: maxAllowed,
        message: 'Cliente novo, pode agendar'
      };
    }

    // 3. Contar agendamentos ativos do cliente
    const { data: appointments, error: appError } = await supabase
      .from('appointments')
      .select('id')
      .eq('company_id', companyId)
      .eq('client_id', client.id)
      .eq('status', 'confirmed')
      .gte('appointment_date', new Date().toISOString().split('T')[0]);

    if (appError) throw appError;

    const currentCount = appointments?.length || 0;
    const canBook = currentCount < maxAllowed;

    const result = {
      can_book: canBook,
      current_count: currentCount,
      max_allowed: maxAllowed,
      message: canBook 
        ? `Cliente pode agendar (${currentCount}/${maxAllowed})` 
        : `Limite atingido (${currentCount}/${maxAllowed})`
    };

    devLog('✅ Verificação de limite concluída:', result);
    return result;
    
  } catch (error) {
    devError('❌ Erro ao verificar limite de agendamentos:', error);
    return null;
  }
};

/**
 * Verifica se um horário específico está disponível
 */
export const checkSlotAvailability = async (
  companyId: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceDuration: number = 30
): Promise<SlotAvailabilityCheck | null> => {
  try {
    devLog('🔍 Verificando disponibilidade do horário:', {
      companyId,
      appointmentDate,
      appointmentTime,
      serviceDuration
    });
    
    const { data, error } = await supabase.rpc('check_slot_availability', {
      p_company_id: companyId,
      p_appointment_date: appointmentDate,
      p_appointment_time: appointmentTime,
      p_service_duration: serviceDuration
    });

    if (error) throw error;

    const result = data[0] as SlotAvailabilityCheck;
    devLog('✅ Verificação de disponibilidade concluída:', result);
    
    return result;
    
  } catch (error) {
    devError('❌ Erro ao verificar disponibilidade do horário:', error);
    return null;
  }
};

/**
 * Validação completa antes de criar um agendamento
 */
export const validateBookingRequest = async (
  companyId: string,
  clientPhone: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceDuration: number = 30,
  excludeAppointmentId?: string
): Promise<BookingValidationResult> => {
  const errors: string[] = [];
  
  try {
    devLog('🔍 Iniciando validação completa do agendamento:', {
      companyId,
      clientPhone,
      appointmentDate,
      appointmentTime
    });

    // Verificar limite do cliente
    const clientLimits = await checkClientBookingLimit(
      companyId,
      clientPhone,
      excludeAppointmentId
    );
    
    if (!clientLimits) {
      errors.push('Erro ao verificar limite de agendamentos do cliente');
    } else if (!clientLimits.can_book) {
      errors.push(clientLimits.message);
    }

    // Verificar disponibilidade do horário
    const slotAvailability = await checkSlotAvailability(
      companyId,
      appointmentDate,
      appointmentTime,
      serviceDuration
    );
    
    if (!slotAvailability) {
      errors.push('Erro ao verificar disponibilidade do horário');
    } else if (!slotAvailability.is_available) {
      errors.push(slotAvailability.message);
    }

    const result: BookingValidationResult = {
      isValid: errors.length === 0,
      errors,
      clientLimits: clientLimits || undefined,
      slotAvailability: slotAvailability || undefined
    };

    devLog('✅ Validação completa concluída:', result);
    return result;
    
  } catch (error) {
    devError('❌ Erro na validação do agendamento:', error);
    return {
      isValid: false,
      errors: ['Erro interno na validação do agendamento']
    };
  }
};

/**
 * Cria um agendamento com controle de concorrência
 */
export const createBookingWithConcurrencyControl = async (
  bookingData: {
    company_id: string;
    client_name: string;
    client_phone: string;
    client_email?: string;
    appointment_date: string;
    appointment_time: string;
    service_id?: string;
    service_duration?: number;
    professional_id?: string;
    notes?: string;
  }
): Promise<{ success: boolean; appointment?: any; error?: string }> => {
  try {
    devLog('🔄 Criando agendamento com controle de concorrência:', bookingData);

    // Validação prévia
    const validation = await validateBookingRequest(
      bookingData.company_id,
      bookingData.client_phone,
      bookingData.appointment_date,
      bookingData.appointment_time,
      bookingData.service_duration || 30
    );

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join('; ')
      };
    }

    // CORREÇÃO: Usar lógica direta da aplicação em vez de RPC
    
    // 1. Primeiro, criar ou encontrar o cliente usando a função correta
    const { createOrUpdateClient } = await import('./clientService');
    const { client } = await createOrUpdateClient(bookingData.company_id, {
      name: bookingData.client_name,
      phone: bookingData.client_phone,
      email: bookingData.client_email
    });

    // 2. Criar o agendamento com o cliente correto
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        company_id: bookingData.company_id,
        client_id: client.id,
        appointment_date: bookingData.appointment_date,
        appointment_time: bookingData.appointment_time,
        service_id: bookingData.service_id,
        duration: bookingData.service_duration || 30,
        professional_id: bookingData.professional_id,
        notes: bookingData.notes,
        status: 'confirmed'
      })
      .select()
      .single();

    if (error) {
      devError('❌ Erro ao criar agendamento:', error);
      return {
        success: false,
        error: error.message
      };
    }

    devLog('✅ Agendamento criado com sucesso:', data);
    
    // Notificar sobre novo agendamento via Realtime
    await notifyBookingUpdate(bookingData.company_id, bookingData.appointment_date);
    
    return {
      success: true,
      appointment: data
    };
    
  } catch (error) {
    devError('❌ Erro na criação do agendamento:', error);
    return {
      success: false,
      error: 'Erro interno ao criar agendamento'
    };
  }
};

/**
 * Notifica sobre mudanças nos agendamentos via Realtime
 */
export const notifyBookingUpdate = async (
  companyId: string,
  appointmentDate: string
): Promise<void> => {
  try {
    const channel = supabase.channel(`bookings-${companyId}-${appointmentDate}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'booking_updated',
      payload: {
        company_id: companyId,
        appointment_date: appointmentDate,
        timestamp: new Date().toISOString()
      }
    });
    
    devLog('📡 Notificação de agendamento enviada:', { companyId, appointmentDate });
    
  } catch (error) {
    devError('❌ Erro ao enviar notificação de agendamento:', error);
  }
};

/**
 * Subscreve a mudanças nos agendamentos de uma data específica
 */
export const subscribeToBookingUpdates = (
  companyId: string,
  appointmentDate: string,
  callback: () => void
): (() => void) => {
  const channel = supabase.channel(`bookings-${companyId}-${appointmentDate}`);
  
  channel
    .on('broadcast', { event: 'booking_updated' }, (payload) => {
      devLog('📡 Agendamento atualizado via Realtime:', payload);
      callback();
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Limpa agendamentos expirados ou cancelados
 */
export const cleanupExpiredBookings = async (companyId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'expired' })
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .lt('appointment_date', new Date().toISOString().split('T')[0]);

    if (error) throw error;

    devLog('🧹 Limpeza de agendamentos expirados concluída');
    
  } catch (error) {
    devError('❌ Erro na limpeza de agendamentos:', error);
  }
};