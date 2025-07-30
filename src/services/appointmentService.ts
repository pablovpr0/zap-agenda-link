
import { BookingFormData, CompanySettings, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { formatAppointmentDate } from '@/utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';

export const createAppointment = async (
  formData: BookingFormData,
  companySettings: CompanySettings,
  services: Service[],
  professionals: Professional[]
) => {
  const { selectedService, selectedProfessional, selectedDate, selectedTime, clientName, clientPhone } = formData;

  // Validação explícita do company_id
  if (!companySettings?.company_id) {
    console.error('🚫 Erro: company_id não encontrado em companySettings');
    throw new Error('Configurações da empresa não encontradas');
  }

  console.log('✅ company_id validado:', companySettings.company_id);

  // Verificar se o horário ainda está disponível
  const { data: existingAppointments, error: checkError } = await supabase
    .from('appointments')
    .select('*')
    .eq('company_id', companySettings.company_id)
    .eq('appointment_date', selectedDate)
    .eq('appointment_time', selectedTime)
    .neq('status', 'cancelled');

  if (checkError) {
    console.error('Erro ao verificar disponibilidade:', checkError);
    throw new Error('Erro ao verificar disponibilidade do horário');
  }

  if (existingAppointments && existingAppointments.length > 0) {
    throw new Error('Este horário já foi ocupado. Por favor, escolha outro horário.');
  }

  // Criar ou encontrar cliente
  let clientId;
  const { data: existingClient, error: clientCheckError } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', companySettings.company_id)
    .eq('phone', clientPhone)
    .maybeSingle();

  if (clientCheckError) {
    console.error('Erro ao verificar cliente existente:', clientCheckError);
    throw new Error('Erro ao verificar dados do cliente');
  }

  if (existingClient) {
    clientId = existingClient.id;
    
    // Atualizar nome do cliente se necessário
    if (existingClient.name !== clientName) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ name: clientName })
        .eq('id', clientId);

      if (updateError) {
        console.error('Erro ao atualizar cliente:', updateError);
        // Não falha se não conseguir atualizar o nome
      }
    }
  } else {
    // Criar novo cliente
    const { data: newClient, error: createClientError } = await supabase
      .from('clients')
      .insert({
        company_id: companySettings.company_id,
        name: clientName,
        phone: clientPhone
      })
      .select()
      .single();

    if (createClientError) {
      console.error('Erro ao criar cliente:', createClientError);
      throw new Error('Erro ao criar cadastro do cliente');
    }

    console.log('✅ Cliente criado com sucesso:', newClient.id);
    clientId = newClient.id;
  }

  // Encontrar duração do serviço
  const service = services.find(s => s.id === selectedService);

  // Criar agendamento
  const { data: newAppointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      company_id: companySettings.company_id,
      client_id: clientId,
      service_id: selectedService,
      professional_id: selectedProfessional || null,
      appointment_date: selectedDate,
      appointment_time: selectedTime,
      duration: service?.duration || 60,
      status: 'confirmed'
    })
    .select()
    .single();

  if (appointmentError) {
    console.error('Erro ao criar agendamento:', appointmentError);
    throw new Error('Erro ao criar agendamento');
  }

  return {
    appointment: newAppointment,
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
