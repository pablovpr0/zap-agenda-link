
import { supabase } from '@/integrations/supabase/client';
import { BookingFormData, CompanySettings, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { formatAppointmentDate } from '@/utils/dateUtils';

export const createAppointment = async (
  formData: BookingFormData,
  companySettings: CompanySettings,
  services: Service[],
  professionals: Professional[]
) => {
  const { selectedService, selectedProfessional, selectedDate, selectedTime, clientName, clientPhone } = formData;

  // Verificar se horário ainda está disponível
  const { data: conflictCheck, error: conflictError } = await supabase
    .from('appointments')
    .select('id')
    .eq('company_id', companySettings.company_id)
    .eq('appointment_date', selectedDate)
    .eq('appointment_time', selectedTime)
    .neq('status', 'cancelled');

  if (conflictError) {
    console.error('Erro ao verificar conflitos:', conflictError);
  }

  if (conflictCheck && conflictCheck.length > 0) {
    throw new Error('Este horário já foi ocupado. Por favor, escolha outro horário.');
  }

  // Criar ou buscar cliente
  let clientId;
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('company_id', companySettings.company_id)
    .eq('phone', clientPhone)
    .maybeSingle();

  if (existingClient) {
    clientId = existingClient.id;
    
    await supabase
      .from('clients')
      .update({
        name: clientName,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        company_id: companySettings.company_id,
        name: clientName,
        phone: clientPhone,
      })
      .select('id')
      .single();

    if (clientError) {
      console.error('Erro ao criar cliente:', clientError);
      throw clientError;
    }
    clientId = newClient.id;
  }

  // Buscar duração do serviço
  const service = services.find(s => s.id === selectedService);

  // Criar agendamento
  const appointmentData = {
    company_id: companySettings.company_id,
    client_id: clientId,
    service_id: selectedService,
    professional_id: selectedProfessional || null,
    appointment_date: selectedDate,
    appointment_time: selectedTime,
    duration: service?.duration || 60,
    status: 'confirmed',
  };

  const { data: appointmentResult, error: appointmentError } = await supabase
    .from('appointments')
    .insert(appointmentData)
    .select('*')
    .single();

  if (appointmentError) {
    console.error('Erro ao criar agendamento:', appointmentError);
    throw appointmentError;
  }

  return {
    appointment: appointmentResult,
    service,
    formattedDate: formatAppointmentDate(selectedDate),
    professionalName: selectedProfessional 
      ? professionals.find(p => p.id === selectedProfessional)?.name || 'Profissional'
      : 'Qualquer profissional'
  };
};

export const generateWhatsAppMessage = (
  clientName: string,
  clientPhone: string,
  formattedDate: string,
  selectedTime: string,
  serviceName: string,
  professionalName: string
) => {
  return `🗓️ *NOVO AGENDAMENTO*\n\n` +
    `👤 *Cliente:* ${clientName}\n` +
    `📞 *Telefone:* ${clientPhone}\n` +
    `📅 *Data:* ${formattedDate}\n` +
    `⏰ *Horário:* ${selectedTime}\n` +
    `💼 *Serviço:* ${serviceName}\n` +
    `👨‍💼 *Profissional:* ${professionalName}\n` +
    `\n✅ Agendamento confirmado automaticamente!`;
};
