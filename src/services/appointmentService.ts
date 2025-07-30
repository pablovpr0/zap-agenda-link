
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
  console.log('🔒 Contexto de autenticação atual:', {
    user: supabase.auth.getUser(),
    session: supabase.auth.getSession()
  });

  // Verificar se o horário ainda está disponível
  const { data: existingAppointments, error: checkError } = await supabase
    .from('appointments')
    .select('*')
    .eq('company_id', companySettings.company_id)
    .eq('appointment_date', selectedDate)
    .eq('appointment_time', selectedTime)
    .neq('status', 'cancelled');

  if (checkError) {
    console.error('❌ Erro ao verificar disponibilidade:', checkError);
    throw new Error('Erro ao verificar disponibilidade do horário');
  }

  if (existingAppointments && existingAppointments.length > 0) {
    throw new Error('Este horário já foi ocupado. Por favor, escolha outro horário.');
  }

  // Usar função SQL segura para criar/encontrar cliente
  console.log('🔧 Tentando criar cliente usando função SQL segura...');
  
  let clientId;
  try {
    const { data: clientResult, error: clientError } = await supabase
      .rpc('create_public_client', {
        p_company_id: companySettings.company_id,
        p_name: clientName,
        p_phone: clientPhone,
        p_email: formData.clientEmail || null
      });

    if (clientError) {
      console.error('❌ Erro na função create_public_client:', clientError);
      
      // Fallback: tentar inserção direta
      console.log('🔄 Tentando inserção direta como fallback...');
      
      // Verificar se cliente já existe
      const { data: existingClient, error: checkClientError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companySettings.company_id)
        .eq('phone', clientPhone)
        .maybeSingle();

      if (checkClientError) {
        console.error('❌ Erro ao verificar cliente existente:', checkClientError);
        throw new Error('Erro ao verificar dados do cliente');
      }

      if (existingClient) {
        clientId = existingClient.id;
        console.log('✅ Cliente existente encontrado:', clientId);
        
        // Atualizar nome se necessário
        if (existingClient.name !== clientName) {
          const { error: updateError } = await supabase
            .from('clients')
            .update({ name: clientName })
            .eq('id', clientId);

          if (updateError) {
            console.error('⚠️ Erro ao atualizar cliente:', updateError);
          }
        }
      } else {
        // Tentar inserção direta com logs detalhados
        console.log('🆕 Tentando criar novo cliente diretamente...');
        console.log('📝 Dados do cliente:', {
          company_id: companySettings.company_id,
          name: clientName,
          phone: clientPhone,
          email: formData.clientEmail || null
        });

        const { data: newClient, error: createClientError } = await supabase
          .from('clients')
          .insert({
            company_id: companySettings.company_id,
            name: clientName,
            phone: clientPhone,
            email: formData.clientEmail || null
          })
          .select()
          .single();

        if (createClientError) {
          console.error('❌ Erro detalhado ao criar cliente:', {
            error: createClientError,
            code: createClientError.code,
            message: createClientError.message,
            details: createClientError.details,
            hint: createClientError.hint
          });
          throw new Error(`Erro ao criar cadastro do cliente: ${createClientError.message}`);
        }

        console.log('✅ Cliente criado com sucesso via inserção direta:', newClient.id);
        clientId = newClient.id;
      }
    } else {
      clientId = clientResult;
      console.log('✅ Cliente criado/encontrado via função SQL:', clientId);
    }
  } catch (error: any) {
    console.error('❌ Erro geral na criação do cliente:', error);
    throw new Error(`Erro ao processar dados do cliente: ${error.message}`);
  }

  // Encontrar duração do serviço
  const service = services.find(s => s.id === selectedService);

  // Usar função SQL segura para criar agendamento
  console.log('🗓️ Tentando criar agendamento usando função SQL segura...');
  
  try {
    const { data: appointmentResult, error: appointmentError } = await supabase
      .rpc('create_public_appointment', {
        p_company_id: companySettings.company_id,
        p_client_id: clientId,
        p_service_id: selectedService,
        p_professional_id: selectedProfessional || null,
        p_appointment_date: selectedDate,
        p_appointment_time: selectedTime,
        p_duration: service?.duration || 60
      });

    if (appointmentError) {
      console.error('❌ Erro na função create_public_appointment:', appointmentError);
      
      // Fallback: inserção direta
      console.log('🔄 Tentando inserção direta de agendamento...');
      
      const { data: newAppointment, error: directAppointmentError } = await supabase
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

      if (directAppointmentError) {
        console.error('❌ Erro ao criar agendamento direto:', directAppointmentError);
        throw new Error(`Erro ao criar agendamento: ${directAppointmentError.message}`);
      }

      console.log('✅ Agendamento criado via inserção direta:', newAppointment.id);
      
      return {
        appointment: newAppointment,
        service,
        formattedDate: formatAppointmentDate(selectedDate),
        professionalName: selectedProfessional 
          ? professionals.find(p => p.id === selectedProfessional)?.name || 'Profissional'
          : 'Qualquer profissional'
      };
    } else {
      console.log('✅ Agendamento criado via função SQL:', appointmentResult);
      
      // Buscar dados do agendamento criado
      const { data: appointmentData, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentResult)
        .single();

      if (fetchError) {
        console.error('⚠️ Erro ao buscar dados do agendamento:', fetchError);
      }

      return {
        appointment: appointmentData || { id: appointmentResult },
        service,
        formattedDate: formatAppointmentDate(selectedDate),
        professionalName: selectedProfessional 
          ? professionals.find(p => p.id === selectedProfessional)?.name || 'Profissional'
          : 'Qualquer profissional'
      };
    }
  } catch (error: any) {
    console.error('❌ Erro geral na criação do agendamento:', error);
    throw new Error(`Erro ao criar agendamento: ${error.message}`);
  }
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
