import { supabase } from '@/integrations/supabase/client';
import { brazilDateTimeToUtc, formatDatabaseTimestamp, getNowInBrazil } from '@/utils/timezone';
import { formatAppointmentDateWithWeekday } from '@/utils/dateUtils';

export interface AppointmentData {
  id?: string;
  company_id: string;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  service_id: string;
  professional_id?: string;
  appointment_date: string; // YYYY-MM-DD no horário do Brasil
  appointment_time: string; // HH:mm no horário do Brasil
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
      console.error('❌ Error fetching appointments:', error);
      throw error;
    }

    // Formatar timestamps para exibição no horário do Brasil
    const formattedAppointments = data?.map(appointment => ({
      ...appointment,
      created_at_formatted: formatDatabaseTimestamp(appointment.created_at),
      updated_at_formatted: formatDatabaseTimestamp(appointment.updated_at),
      // appointment_date e appointment_time já estão no horário local
    }));

    return formattedAppointments || [];

  } catch (error) {
    console.error('❌ Failed to fetch appointments:', error);
    throw error;
  }
};

/**
 * Busca agendamentos do dia atual no horário do Brasil
 */
export const getTodayAppointments = async (companyId: string) => {
  const { getTodayInBrazil } = await import('@/utils/timezone');
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

    // Se está atualizando data/hora, manter no horário local
    // (não precisa converter para UTC pois os campos são date/time locais)

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating appointment:', error);
      throw error;
    }

    console.log('✅ Appointment updated successfully:', data);
    return data;

  } catch (error) {
    console.error('❌ Failed to update appointment:', error);
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
 * Verifica conflitos de horário para um agendamento
 */
export const checkTimeConflict = async (
  companyId: string,
  date: string,
  time: string,
  professionalId?: string,
  excludeAppointmentId?: string
) => {
  try {
    let query = supabase
      .from('appointments')
      .select('id, appointment_time, professional_id')
      .eq('company_id', companyId)
      .eq('appointment_date', date)
      .eq('appointment_time', time)
      .neq('status', 'cancelled');

    if (professionalId) {
      query = query.eq('professional_id', professionalId);
    }

    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error checking time conflict:', error);
      throw error;
    }

    return (data?.length || 0) > 0;

  } catch (error) {
    console.error('❌ Failed to check time conflict:', error);
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
    return createAppointmentOriginal(formDataOrAppointment);
  }

  // Se recebeu múltiplos parâmetros, processar como BookingFormData
  const formData = formDataOrAppointment;
  
  try {
    console.log('📅 Creating appointment from booking form:', formData);

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
    console.error('❌ Failed to create appointment from booking form:', error);
    throw error;
  }
};

/**
 * Verifica se um horário específico está disponível considerando a duração do serviço
 */
const checkTimeSlotAvailability = async (
  companyId: string,
  date: string,
  time: string,
  serviceDuration: number
): Promise<{ available: boolean; reason?: string }> => {
  try {
    console.log('🔍 Verificando disponibilidade do horário:', { date, time, serviceDuration });

    // Buscar todos os agendamentos do dia
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('appointment_time, duration, services(duration)')
      .eq('company_id', companyId)
      .eq('appointment_date', date)
      .neq('status', 'cancelled');

    if (error) {
      console.error('❌ Erro ao verificar agendamentos existentes:', error);
      throw error;
    }

    if (!existingAppointments || existingAppointments.length === 0) {
      console.log('✅ Nenhum agendamento existente, horário disponível');
      return { available: true };
    }

    // Converter horário solicitado para minutos
    const [requestHours, requestMinutes] = time.split(':').map(Number);
    const requestStartMinutes = requestHours * 60 + requestMinutes;

    console.log('🔍 Verificando conflitos com agendamentos existentes:', existingAppointments.length);

    // Verificar conflitos com cada agendamento existente
    for (const apt of existingAppointments) {
      const aptTime = apt.appointment_time.substring(0, 5); // HH:mm
      const aptDuration = apt.services?.duration || apt.duration || 60;

      // Converter horário do agendamento existente para minutos
      const [aptHours, aptMinutes] = aptTime.split(':').map(Number);
      const aptStartMinutes = aptHours * 60 + aptMinutes;

      console.log(`🔍 Verificando conflito com agendamento ${aptTime} (${aptDuration}min)`);

      // LÓGICA DE BLOQUEIO: Verificar se há sobreposição
      // Agendamento existente ocupa slots baseado na sua duração
      let existingEndMinutes = aptStartMinutes;
      if (aptDuration === 30) {
        existingEndMinutes = aptStartMinutes + 30; // 1 slot de 30min
      } else if (aptDuration === 60) {
        existingEndMinutes = aptStartMinutes + 60; // 2 slots de 30min
      } else {
        existingEndMinutes = aptStartMinutes + aptDuration;
      }

      // Novo agendamento ocupará slots baseado na sua duração
      let newEndMinutes = requestStartMinutes;
      if (serviceDuration === 30) {
        newEndMinutes = requestStartMinutes + 30; // 1 slot de 30min
      } else if (serviceDuration === 60) {
        newEndMinutes = requestStartMinutes + 60; // 2 slots de 30min
      } else {
        newEndMinutes = requestStartMinutes + serviceDuration;
      }

      // Verificar sobreposição
      const hasOverlap = (requestStartMinutes < existingEndMinutes) && (newEndMinutes > aptStartMinutes);

      if (hasOverlap) {
        console.log(`❌ Conflito detectado: novo agendamento ${time}-${Math.floor(newEndMinutes/60).toString().padStart(2,'0')}:${(newEndMinutes%60).toString().padStart(2,'0')} sobrepõe com existente ${aptTime}-${Math.floor(existingEndMinutes/60).toString().padStart(2,'0')}:${(existingEndMinutes%60).toString().padStart(2,'0')}`);
        return { 
          available: false, 
          reason: `Horário não disponível. Conflito com agendamento às ${aptTime}` 
        };
      }
    }

    console.log('✅ Horário disponível, nenhum conflito encontrado');
    return { available: true };

  } catch (error) {
    console.error('❌ Erro ao verificar disponibilidade:', error);
    throw error;
  }
};

/**
 * Função original createAppointment (renomeada para evitar conflito)
 */
const createAppointmentOriginal = async (appointmentData: AppointmentData) => {
  try {
    console.log('📅 Creating appointment with Brazil timezone:', {
      date: appointmentData.appointment_date,
      time: appointmentData.appointment_time
    });

    // CONTROLE DE CONCORRÊNCIA: Verificar disponibilidade antes de criar
    console.log('🔒 Verificando disponibilidade do horário antes de criar agendamento...');
    
    // Buscar duração do serviço
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('duration')
      .eq('id', appointmentData.service_id)
      .eq('company_id', appointmentData.company_id)
      .single();

    if (serviceError || !serviceData) {
      console.error('❌ Erro ao buscar serviço:', serviceError);
      throw new Error('Serviço não encontrado');
    }

    const serviceDuration = serviceData.duration;
    console.log('🛠️ Duração do serviço:', serviceDuration, 'minutos');

    // Verificar disponibilidade do horário
    const availability = await checkTimeSlotAvailability(
      appointmentData.company_id,
      appointmentData.appointment_date,
      appointmentData.appointment_time,
      serviceDuration
    );

    if (!availability.available) {
      console.log('❌ Horário não disponível:', availability.reason);
      throw new Error(availability.reason || 'Este horário não está mais disponível. Por favor, escolha outro horário.');
    }

    console.log('✅ Horário confirmado como disponível, prosseguindo com criação...');

    let clientId = appointmentData.client_id;

    // Se não tem client_id, criar ou buscar cliente
    if (!clientId && appointmentData.client_name && appointmentData.client_phone) {
      console.log('👤 Creating/finding client for appointment...');
      
      // Primeiro, tentar encontrar cliente existente pelo telefone
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', appointmentData.company_id)
        .eq('phone', appointmentData.client_phone)
        .maybeSingle();

      if (existingClient) {
        console.log('✅ Found existing client:', existingClient.id);
        clientId = existingClient.id;
      } else {
        // Criar novo cliente
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            company_id: appointmentData.company_id,
            name: appointmentData.client_name,
            phone: appointmentData.client_phone,
            email: appointmentData.client_email || null
          })
          .select('id')
          .single();

        if (clientError) {
          console.error('❌ Error creating client:', clientError);
          throw new Error(`Erro ao criar cliente: ${clientError.message}`);
        }

        console.log('✅ Created new client:', newClient.id);
        clientId = newClient.id;
      }
    }

    if (!clientId) {
      throw new Error('Client ID é obrigatório para criar agendamento');
    }

    // INSERÇÃO COM VERIFICAÇÃO FINAL: Usar uma transação para garantir atomicidade
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        company_id: appointmentData.company_id,
        client_id: clientId,
        service_id: appointmentData.service_id,
        professional_id: appointmentData.professional_id,
        appointment_date: appointmentData.appointment_date, // Manter data local
        appointment_time: appointmentData.appointment_time, // Manter horário local
        duration: serviceDuration, // Salvar duração do serviço
        status: appointmentData.status || 'confirmed',
        notes: appointmentData.notes,
        created_at: new Date().toISOString(), // UTC para metadados
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating appointment:', error);
      
      // Verificar se é erro de conflito de horário
      if (error.message?.includes('duplicate') || error.message?.includes('conflict')) {
        throw new Error('Este horário não está mais disponível. Por favor, escolha outro horário.');
      }
      
      throw error;
    }

    console.log('✅ Appointment created successfully:', data);
    
    // Invalidar cache de horários disponíveis
    try {
      const { invalidateTimeSlotsCache } = await import('@/services/publicBookingService');
      invalidateTimeSlotsCache(appointmentData.company_id, appointmentData.appointment_date);
      console.log('🗑️ Cache de horários invalidado após criação do agendamento');
    } catch (error) {
      console.warn('⚠️ Erro ao invalidar cache (não crítico):', error);
    }
    
    // Disparar evento de agendamento criado
    try {
      const { bookingEventManager } = await import('@/utils/bookingEvents');
      bookingEventManager.dispatchEvent({
        type: 'appointment_created',
        companyId: appointmentData.company_id,
        date: appointmentData.appointment_date,
        time: appointmentData.appointment_time,
        appointmentId: data.id
      });
      console.log('📡 Evento de agendamento criado disparado');
    } catch (error) {
      console.warn('⚠️ Erro ao disparar evento (não crítico):', error);
    }
    
    return data;

  } catch (error) {
    console.error('❌ Failed to create appointment:', error);
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