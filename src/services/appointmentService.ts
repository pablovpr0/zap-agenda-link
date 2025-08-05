import { supabase } from '@/integrations/supabase/client';
import { brazilDateTimeToUtc, formatDatabaseTimestamp, getNowInBrazil } from '@/utils/timezone';

export interface AppointmentData {
  id?: string;
  company_id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  service_id: string;
  professional_id?: string;
  appointment_date: string; // YYYY-MM-DD no horário do Brasil
  appointment_time: string; // HH:mm no horário do Brasil
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
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
      status: 'scheduled',
      notes: formData.notes
    };

    // Criar o agendamento
    const appointment = await createAppointmentOriginal(appointmentData);

    // Formatar data para exibição
    const appointmentDate = new Date(formData.selectedDate);
    const formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

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
 * Função original createAppointment (renomeada para evitar conflito)
 */
const createAppointmentOriginal = async (appointmentData: AppointmentData) => {
  try {
    console.log('📅 Creating appointment with Brazil timezone:', {
      date: appointmentData.appointment_date,
      time: appointmentData.appointment_time
    });

    // Converter data/hora do Brasil para UTC para salvar no banco
    const utcDateTime = brazilDateTimeToUtc(
      appointmentData.appointment_date, 
      appointmentData.appointment_time
    );

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        company_id: appointmentData.company_id,
        client_name: appointmentData.client_name,
        client_phone: appointmentData.client_phone,
        client_email: appointmentData.client_email,
        service_id: appointmentData.service_id,
        professional_id: appointmentData.professional_id,
        appointment_date: appointmentData.appointment_date, // Manter data local
        appointment_time: appointmentData.appointment_time, // Manter horário local
        status: appointmentData.status || 'scheduled',
        notes: appointmentData.notes,
        created_at: new Date().toISOString(), // UTC para metadados
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating appointment:', error);
      throw error;
    }

    console.log('✅ Appointment created successfully:', data);
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