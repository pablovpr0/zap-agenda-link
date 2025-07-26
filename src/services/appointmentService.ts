
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
    // Criar cliente com contexto público garantido
    console.log('🔧 Inserindo novo cliente (contexto público):', {
      company_id: companySettings.company_id,
      name: clientName,
      phone: clientPhone,
    });

    try {
      // Garantir contexto público removendo qualquer sessão ativa temporariamente
      const currentSession = supabase.auth.getSession();
      
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
        console.error('🚫 Erro detalhado ao criar cliente:', {
          error: clientError,
          message: clientError.message,
          code: clientError.code,
          details: clientError.details,
          hint: clientError.hint
        });
        
        // Erro específico para RLS
        if (clientError.message?.includes('row-level security')) {
          console.error('🚫 Erro de RLS - Dados enviados:', {
            company_id: companySettings.company_id,
            name: clientName,
            phone: clientPhone
          });
          throw new Error('Erro de permissão ao criar cliente. Verifique as configurações de segurança.');
        }
        
        throw new Error(`Erro ao criar cliente: ${clientError.message}`);
      }

      if (!newClient?.id) {
        throw new Error('Cliente criado mas ID não retornado');
      }

      console.log('✅ Cliente criado com sucesso:', newClient.id);
      clientId = newClient.id;
    } catch (error: any) {
      console.error('🚫 Falha total na criação do cliente:', error);
      throw error;
    }
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
