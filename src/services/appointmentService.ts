
import { supabase } from '@/integrations/supabase/client';
import { formatDatabaseTimestamp, getNowInBrazil, getTodayInBrazil } from '@/utils/timezone';
import { formatAppointmentDateWithWeekday } from '@/utils/dateUtils';
import { createOrUpdateClient } from './clientService';
import { isTimeSlotAvailable } from './availableTimesService';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

export interface AppointmentData {
  id?: string;
  company_id: string;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  service_id: string;
  professional_id?: string;
  appointment_date: string;
  appointment_time: string;
  status?: 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Busca agendamentos de uma empresa formatando timestamps para horário do Brasil
 */
export const getCompanyAppointments = async (companyId: string, startDate?: string, endDate?: string) => {
  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        services (name, duration, price),
        professionals (name)
      `)
      .eq('company_id', companyId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (startDate) {
      query = query.gte('appointment_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('appointment_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      devError('❌ Error fetching appointments:', error);
      throw error;
    }

    // Formatar timestamps para exibição no horário do Brasil
    const formattedAppointments = data?.map(appointment => ({
      ...appointment,
      created_at_formatted: formatDatabaseTimestamp(appointment.created_at),
      updated_at_formatted: formatDatabaseTimestamp(appointment.updated_at),
    }));

    return formattedAppointments || [];

  } catch (error) {
    devError('❌ Failed to fetch appointments:', error);
    throw error;
  }
};

/**
 * Busca agendamentos do dia atual no horário do Brasil
 */
export const getTodayAppointments = async (companyId: string) => {
  const today = getTodayInBrazil();
  return getCompanyAppointments(companyId, today, today);
};

/**
 * Atualiza um agendamento
 */
export const updateAppointment = async (appointmentId: string, updates: Partial<AppointmentData>) => {
  try {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;

  } catch (error) {
    throw error;
  }
};

/**
 * Cancela um agendamento
 */
export const cancelAppointment = async (appointmentId: string, reason?: string) => {
  return updateAppointment(appointmentId, {
    status: 'cancelled',
    notes: reason ? `Cancelado: ${reason}` : 'Cancelado'
  });
};

/**
 * Verifica conflitos de horário para um agendamento com validação aprimorada
 */
export const checkTimeConflict = async (
  companyId: string,
  date: string,
  time: string,
  serviceDuration: number = 60,
  excludeAppointmentId?: string
) => {
  try {
    devLog(`🔍 Verificando conflito para ${date} ${time} (${serviceDuration}min)`);

    // Usar o novo serviço de horários disponíveis
    const availability = await isTimeSlotAvailable(companyId, date, time, serviceDuration);
    
    if (!availability.available) {
      devLog(`❌ Horário não disponível: ${availability.reason}`);
      return true; // Há conflito
    }

    // Verificação adicional para agendamentos específicos (excluindo o próprio)
    let query = supabase
      .from('appointments')
      .select('id, appointment_time, duration')
      .eq('company_id', companyId)
      .eq('appointment_date', date)
      .neq('status', 'cancelled');

    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId);
    }

    const { data, error } = await query;

    if (error) {
      devError('❌ Erro ao verificar conflitos:', error);
      return true; // Em caso de erro, assumir conflito por segurança
    }

    // Verificar sobreposição com agendamentos existentes
    const [requestHours, requestMinutes] = time.split(':').map(Number);
    const requestStartMinutes = requestHours * 60 + requestMinutes;
    const requestEndMinutes = requestStartMinutes + serviceDuration;

    const hasConflict = data?.some(apt => {
      const aptTime = apt.appointment_time.substring(0, 5);
      const [aptHours, aptMinutes] = aptTime.split(':').map(Number);
      const aptStartMinutes = aptHours * 60 + aptMinutes;
      const aptEndMinutes = aptStartMinutes + (apt.duration || 60);

      // Verificar sobreposição
      const overlap = (requestStartMinutes < aptEndMinutes) && (requestEndMinutes > aptStartMinutes);
      
      if (overlap) {
        devLog(`⚠️ Conflito detectado com agendamento às ${aptTime}`);
      }
      
      return overlap;
    });

    return hasConflict || false;

  } catch (error) {
    devError('❌ Erro ao verificar conflito:', error);
    return true; // Em caso de erro, assumir conflito
  }
};

/**
 * Valida limite de agendamentos por cliente
 */
const validateClientBookingLimit = async (
  companyId: string,
  clientPhone: string,
  excludeAppointmentId?: string
): Promise<{ canBook: boolean; message?: string }> => {
  try {
    // Buscar configurações da empresa
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('max_simultaneous_appointments')
      .eq('company_id', companyId)
      .maybeSingle();

    if (settingsError) {
      devWarn('⚠️ Erro ao buscar configurações, usando limite padrão');
    }

    const maxAppointments = settings?.max_simultaneous_appointments || 3;
    const today = getTodayInBrazil();

    // Query simplificada com tipo explícito
    const queryResult = await supabase
      .from('appointments')
      .select('*')
      .eq('company_id', companyId)
      .eq('client_phone', clientPhone)
      .gte('appointment_date', today);

    if (queryResult.error) {
      devError('❌ Erro ao verificar limite de agendamentos:', queryResult.error);
      return { canBook: true };
    }

    // Usar os dados de forma mais direta
    const allAppointments = queryResult.data || [];
    
    // Filtrar agendamentos ativos
    const activeAppointments = allAppointments.filter(appointment => {
      const status = appointment.status || 'confirmed';
      const isActive = ['confirmed', 'scheduled'].includes(status);
      const shouldExclude = excludeAppointmentId && appointment.id === excludeAppointmentId;
      return isActive && !shouldExclude;
    });

    const currentCount = activeAppointments.length;
    const canBook = currentCount < maxAppointments;

    devLog(`📊 Cliente tem ${currentCount}/${maxAppointments} agendamentos ativos`);

    return {
      canBook,
      message: canBook ? undefined : `Limite de ${maxAppointments} agendamentos simultâneos atingido`
    };

  } catch (error) {
    devError('❌ Erro na validação de limite:', error);
    return { canBook: true };
  }
};

/**
 * Cria um novo agendamento com validações completas
 */
const createAppointmentOriginal = async (appointmentData: AppointmentData): Promise<any> => {
  try {
    devLog('🔄 Criando agendamento:', {
      company_id: appointmentData.company_id,
      client_name: appointmentData.client_name,
      appointment_date: appointmentData.appointment_date,
      appointment_time: appointmentData.appointment_time
    });

    // 1. Buscar duração do serviço
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('duration, name')
      .eq('id', appointmentData.service_id)
      .eq('company_id', appointmentData.company_id)
      .single();

    if (serviceError || !serviceData) {
      throw new Error('Serviço não encontrado');
    }

    const serviceDuration = serviceData.duration;
    devLog(`💼 Serviço: ${serviceData.name} (${serviceDuration}min)`);

    // 2. Validar disponibilidade do horário
    const hasConflict = await checkTimeConflict(
      appointmentData.company_id,
      appointmentData.appointment_date,
      appointmentData.appointment_time,
      serviceDuration
    );

    if (hasConflict) {
      throw new Error('⚠️ Este horário não está mais disponível. Por favor, escolha outro horário.');
    }

    // 3. Validar limite de agendamentos por cliente (se fornecido telefone)
    if (appointmentData.client_phone) {
      const limitCheck = await validateClientBookingLimit(
        appointmentData.company_id,
        appointmentData.client_phone
      );

      if (!limitCheck.canBook) {
        throw new Error(limitCheck.message || 'Limite de agendamentos atingido');
      }
    }

    // 4. Criar ou obter cliente
    let clientId = appointmentData.client_id;

    if (!clientId && appointmentData.client_name && appointmentData.client_phone) {
      devLog('👤 Criando/atualizando cliente');
      
      const { client } = await createOrUpdateClient(appointmentData.company_id, {
        name: appointmentData.client_name,
        phone: appointmentData.client_phone,
        email: appointmentData.client_email || undefined
      });

      clientId = client.id;
      devLog(`✅ Cliente processado: ${client.name} (ID: ${client.id})`);
    }

    if (!clientId) {
      throw new Error('Client ID é obrigatório para criar agendamento');
    }

    // 5. Criar agendamento
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        company_id: appointmentData.company_id,
        client_id: clientId,
        service_id: appointmentData.service_id,
        professional_id: appointmentData.professional_id,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        duration: serviceDuration,
        status: appointmentData.status || 'confirmed',
        notes: appointmentData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Tratar erros específicos
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        throw new Error('⚠️ Este horário não está mais disponível. Outro cliente acabou de agendar neste mesmo horário.');
      }
      
      devError('❌ Erro ao criar agendamento:', error);
      throw error;
    }

    devLog(`✅ Agendamento criado com sucesso: ${data.id}`);
    return data;

  } catch (error) {
    devError('❌ Erro no createAppointmentOriginal:', error);
    throw error;
  }
};

/**
 * Sobrecarga da função createAppointment para compatibilidade com useBookingSubmission
 */
export const createAppointment = async (
  formDataOrAppointment: any,
  companySettings?: any,
  services?: any[],
  professionals?: any[]
): Promise<any> => {
  // Se recebeu apenas um parâmetro (AppointmentData), usar a função original
  if (!companySettings) {
    return createAppointmentOriginal(formDataOrAppointment as AppointmentData);
  }

  // Se recebeu múltiplos parâmetros, processar como BookingFormData
  const formData = formDataOrAppointment;
  
  try {
    // Encontrar o serviço selecionado
    const selectedService = services?.find(s => s.id === formData.selectedService);
    const selectedProfessional = professionals?.find(p => p.id === formData.selectedProfessional);

    // Criar dados do agendamento
    const appointmentData: AppointmentData = {
      company_id: companySettings.company_id,
      client_name: formData.clientName,
      client_phone: formData.clientPhone,
      client_email: formData.clientEmail,
      service_id: formData.selectedService,
      professional_id: formData.selectedProfessional,
      appointment_date: formData.selectedDate,
      appointment_time: formData.selectedTime,
      status: 'confirmed',
      notes: formData.notes
    };

    // Criar o agendamento
    const appointment = await createAppointmentOriginal(appointmentData);

    // Formatar data para exibição usando função utilitária
    const formattedDate = formatAppointmentDateWithWeekday(formData.selectedDate);

    // Retornar resultado no formato esperado pelo useBookingSubmission
    return {
      appointment,
      service: selectedService,
      professionalName: selectedProfessional?.name,
      formattedDate
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Gera mensagem do WhatsApp para agendamento
 */
export const generateWhatsAppMessage = (
  clientName: string,
  clientPhone: string,
  date: string,
  time: string,
  serviceName: string,
  professionalName?: string
): string => {
  let message = `Olá! Novo agendamento realizado:\n\n`;
  message += `👤 Cliente: ${clientName}\n`;
  message += `📞 Telefone: ${clientPhone}\n`;
  message += `📅 Data: ${date}\n`;
  message += `⏰ Horário: ${time}\n`;
  message += `💼 Serviço: ${serviceName}\n`;
  
  if (professionalName) {
    message += `👨‍💼 Profissional: ${professionalName}\n`;
  }
  
  message += `\nAgendamento confirmado! ✅`;
  
  return message;
};
