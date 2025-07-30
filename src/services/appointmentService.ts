
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

  // Validação explícita do company_id
  if (!companySettings?.company_id) {
    console.error('🚫 Erro: company_id não encontrado em companySettings');
    throw new Error('Configurações da empresa não encontradas');
  }

  // Validar formato UUID do company_id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(companySettings.company_id)) {
    console.error('🚫 Erro: company_id não está em formato UUID válido:', companySettings.company_id);
    throw new Error('ID da empresa inválido');
  }

  console.log('✅ company_id validado:', companySettings.company_id);

  // Verificar limite mensal do cliente antes de prosseguir
  const { data: monthlyAppointments, error: monthlyError } = await supabase
    .from('appointments')
    .select(`
      id,
      clients!inner(phone)
    `)
    .eq('company_id', companySettings.company_id)
    .eq('clients.phone', clientPhone)
    .gte('appointment_date', new Date().toISOString().slice(0, 7) + '-01')
    .lt('appointment_date', new Date().toISOString().slice(0, 7) + '-32')
    .neq('status', 'cancelled');

  if (!monthlyError && monthlyAppointments) {
    // Buscar limite mensal da empresa
    const { data: settings } = await supabase
      .from('company_settings')
      .select('monthly_appointments_limit')
      .eq('company_id', companySettings.company_id)
      .single();

    const monthlyLimit = settings?.monthly_appointments_limit || 4;
    
    if (monthlyAppointments.length >= monthlyLimit) {
      throw new Error(`Este cliente já atingiu o limite de ${monthlyLimit} agendamentos por mês.`);
    }
  }

  // Validação robusta de conflitos usando a nova função
  const service = services.find(s => s.id === selectedService);
  const serviceDuration = service?.duration || 60;
  
  // Importar a função de validação
  const { validateAppointmentSlot } = await import('@/utils/appointmentValidation');
  
  const conflictValidation = await validateAppointmentSlot(
    companySettings.company_id,
    selectedDate,
    selectedTime,
    serviceDuration
  );

  if (conflictValidation.hasConflict) {
    const conflictMsg = conflictValidation.conflictDetails 
      ? `Este horário conflita com o agendamento de ${conflictValidation.conflictDetails.existingClientName} (${conflictValidation.conflictDetails.existingServiceName}) às ${conflictValidation.conflictDetails.existingAppointmentTime}. Por favor, escolha outro horário.`
      : 'Este horário não está mais disponível. Por favor, escolha outro horário.';
    
    throw new Error(conflictMsg);
  }

  // Criar ou buscar cliente - sempre salvar/atualizar informações
  let clientId;
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id, name, email')
    .eq('company_id', companySettings.company_id)
    .eq('phone', clientPhone)
    .maybeSingle();

  if (existingClient) {
    clientId = existingClient.id;
    
    // Sempre atualizar o nome do cliente caso tenha mudado
    await supabase
      .from('clients')
      .update({
        name: clientName,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);
      
    console.log('✅ Cliente existente atualizado:', clientId);
  } else {
    // Criar novo cliente automaticamente quando faz agendamento público
    console.log('🔧 Inserindo novo cliente automaticamente (agendamento público):', {
      company_id: companySettings.company_id,
      name: clientName,
      phone: clientPhone,
    });

    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        company_id: companySettings.company_id,
        name: clientName,
        phone: clientPhone,
        notes: 'Cliente cadastrado automaticamente via agendamento público'
      })
      .select('id')
      .single();

    if (clientError) {
      console.error('🚫 Erro ao criar cliente:', clientError);
      throw new Error(`Erro ao criar cliente: ${clientError.message}`);
    }

    if (!newClient?.id) {
      throw new Error('Cliente criado mas ID não retornado');
    }

    console.log('✅ Novo cliente criado automaticamente:', newClient.id);
    clientId = newClient.id;
  }

  // Criar agendamento (usando a variável service já definida anteriormente)
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
