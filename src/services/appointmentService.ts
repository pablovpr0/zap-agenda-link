import { supabase } from '@/integrations/supabase/client';
import { BookingFormData, CompanySettings, Service } from '@/types/publicBooking';
import { Professional } from './professionalsService';
import { formatAppointmentDate } from '@/utils/dateUtils';

// Enhanced parameter validation interface
interface ValidatedAppointmentParams {
  p_company_id: string;
  p_client_id: string;
  p_service_id: string;
  p_professional_id: string | null;
  p_appointment_date: string;
  p_appointment_time: string;
  p_duration: number;
}

// Retry mechanism for schema cache issues with proper typing
const retryRpcCall = async (
  functionName: 'create_public_client' | 'create_public_appointment',
  params: any,
  maxRetries: number = 3
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentativa ${attempt}/${maxRetries} - Chamando função: ${functionName}`);
      console.log('📋 Parâmetros:', JSON.stringify(params, null, 2));
      
      const { data, error } = await supabase.rpc(functionName, params);
      
      if (error) {
        console.error(`❌ Erro RPC (tentativa ${attempt}):`, {
          error,
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message
        });
        
        // If it's a function not found error and not the last attempt, wait and retry
        if (error.message?.includes('function') && attempt < maxRetries) {
          console.log(`⏳ Aguardando ${attempt * 1000}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        
        throw error;
      }
      
      console.log(`✅ Sucesso na tentativa ${attempt}:`, data);
      return data;
    } catch (error: any) {
      console.error(`💥 Erro crítico na tentativa ${attempt}:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
};

// Validate and format parameters for RPC call
const validateAndFormatParams = (
  formData: BookingFormData,
  companySettings: CompanySettings,
  clientId: string,
  service: Service,
  professionalId?: string
): ValidatedAppointmentParams => {
  const params = {
    p_company_id: companySettings.company_id,
    p_client_id: clientId,
    p_service_id: formData.selectedService,
    p_professional_id: professionalId || null,
    p_appointment_date: formData.selectedDate,
    p_appointment_time: formData.selectedTime,
    p_duration: service.duration
  };

  // Validate all required parameters
  if (!params.p_company_id) throw new Error('ID da empresa é obrigatório');
  if (!params.p_client_id) throw new Error('ID do cliente é obrigatório');
  if (!params.p_service_id) throw new Error('ID do serviço é obrigatório');
  if (!params.p_appointment_date) throw new Error('Data do agendamento é obrigatória');
  if (!params.p_appointment_time) throw new Error('Horário do agendamento é obrigatório');
  if (!params.p_duration || params.p_duration <= 0) throw new Error('Duração do serviço deve ser maior que zero');

  console.log('✅ Parâmetros validados:', params);
  return params;
};

export const createAppointment = async (
  formData: BookingFormData,
  companySettings: CompanySettings,
  services: Service[],
  professionals: Professional[]
) => {
  const { selectedService, selectedDate, selectedTime, clientName, clientPhone } = formData;
  
  console.log('🔧 createAppointment: Iniciando criação do agendamento');
  console.log('📋 Dados recebidos:', {
    selectedService,
    selectedDate,
    selectedTime,
    clientName,
    clientPhone: clientPhone ? `${clientPhone.substring(0, 4)}****` : 'não informado',
    companyId: companySettings.company_id
  });
  
  // Encontrar o serviço selecionado
  const service = services.find(s => s.id === selectedService);
  if (!service) {
    throw new Error('Serviço não encontrado');
  }

  console.log('📋 Serviço encontrado:', {
    name: service.name,
    duration: service.duration
  });

  // Criar ou encontrar cliente com retry
  console.log('👤 Criando/encontrando cliente...');
  
  let clientId: string;
  try {
    const clientParams = {
      p_company_id: companySettings.company_id,
      p_name: clientName,
      p_phone: clientPhone,
      p_email: formData.clientEmail || null
    };

    clientId = await retryRpcCall('create_public_client', clientParams);
    console.log('✅ Cliente criado/encontrado:', clientId);
  } catch (error: any) {
    console.error('❌ Erro crítico ao criar cliente:', error);
    throw new Error(`Falha ao processar dados do cliente: ${error.message}`);
  }

  // Determinar profissional (usar o primeiro ativo se não especificado)
  let professionalId = formData.selectedProfessional;
  if (!professionalId && professionals.length > 0) {
    professionalId = professionals[0].id;
  }

  console.log('👨‍⚕️ Profissional selecionado:', professionalId);

  // Validar e formatar parâmetros
  console.log('🔍 Validando parâmetros do agendamento...');
  let validatedParams: ValidatedAppointmentParams;
  
  try {
    validatedParams = validateAndFormatParams(
      formData,
      companySettings,
      clientId,
      service,
      professionalId
    );
  } catch (error: any) {
    console.error('❌ Erro na validação de parâmetros:', error);
    throw new Error(`Parâmetros inválidos: ${error.message}`);
  }

  // Criar agendamento com retry e validação aprimorada
  console.log('📅 Criando agendamento...');
  let appointmentId: string;
  
  try {
    appointmentId = await retryRpcCall('create_public_appointment', validatedParams);
    
    if (!appointmentId) {
      throw new Error('Agendamento criado mas ID não retornado');
    }

    console.log('✅ Agendamento criado com sucesso:', appointmentId);
  } catch (error: any) {
    console.error('❌ Erro crítico ao criar agendamento:', error);
    
    // Tratamento específico para diferentes tipos de erro
    if (error.message?.includes('ocupado')) {
      throw new Error('Este horário já está ocupado. Por favor, escolha outro horário.');
    } else if (error.message?.includes('function')) {
      throw new Error('Erro do sistema ao processar agendamento. Tente novamente em alguns instantes.');
    } else if (error.message?.includes('Cliente não encontrado')) {
      throw new Error('Erro ao processar dados do cliente. Verifique as informações.');
    } else if (error.message?.includes('Serviço não encontrado')) {
      throw new Error('Serviço não está disponível. Selecione outro serviço.');
    } else if (error.message?.includes('Empresa não encontrada')) {
      throw new Error('Erro de configuração da empresa. Entre em contato com o suporte.');
    } else {
      throw new Error(`Erro ao criar agendamento: ${error.message}`);
    }
  }

  // Enviar notificação via WhatsApp para o comerciante
  if (companySettings.phone) {
    console.log('📱 Enviando notificação para o comerciante...');
    const professionalName = professionals.find(p => p.id === professionalId)?.name || 'Não especificado';
    const merchantMessage = generateMerchantNotificationMessage(
      clientName,
      clientPhone,
      formatAppointmentDate(selectedDate),
      selectedTime,
      service.name,
      professionalName
    );

    const cleanMerchantPhone = companySettings.phone.replace(/\D/g, '');
    const merchantWhatsappUrl = `https://wa.me/55${cleanMerchantPhone}?text=${encodeURIComponent(merchantMessage)}`;
    
    // Abrir WhatsApp para o comerciante em uma nova aba
    setTimeout(() => {
      window.open(merchantWhatsappUrl, '_blank');
    }, 2000);
  }

  return {
    appointment: { id: appointmentId },
    service,
    professionalName: professionals.find(p => p.id === professionalId)?.name || 'Não especificado',
    formattedDate: formatAppointmentDate(selectedDate)
  };
};

export const generateWhatsAppMessage = (
  clientName: string,
  clientPhone: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceName: string,
  professionalName: string
) => {
  return `Novo Agendamento Confirmado!

Cliente: ${clientName}
Telefone: ${clientPhone}
Data: ${appointmentDate}
Horário: ${appointmentTime}
Serviço: ${serviceName}
Profissional: ${professionalName}`;
};

export const generateMerchantNotificationMessage = (
  clientName: string,
  clientPhone: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceName: string,
  professionalName: string
) => {
  return `NOVO AGENDAMENTO

Cliente: ${clientName}
Telefone: ${clientPhone}
Data: ${appointmentDate}
Horário: ${appointmentTime}
Serviço: ${serviceName}
Profissional: ${professionalName}

Agendamento confirmado automaticamente.`;
};
