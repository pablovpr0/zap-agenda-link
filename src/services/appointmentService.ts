
import { supabase } from '@/integrations/supabase/client';
import { BookingFormData, CompanySettings, Service } from '@/types/publicBooking';
import { Professional } from './professionalsService';
import { formatAppointmentDate } from '@/utils/dateUtils';

export const createAppointment = async (
  formData: BookingFormData,
  companySettings: CompanySettings,
  services: Service[],
  professionals: Professional[]
) => {
  const { selectedService, selectedDate, selectedTime, clientName, clientPhone } = formData;
  
  console.log('🔧 createAppointment: Iniciando criação do agendamento');
  
  // Encontrar o serviço selecionado
  const service = services.find(s => s.id === selectedService);
  if (!service) {
    throw new Error('Serviço não encontrado');
  }

  console.log('📋 Serviço encontrado:', service.name);

  // Criar ou encontrar cliente
  console.log('👤 Criando/encontrando cliente...');
  const { data: clientData, error: clientError } = await supabase
    .rpc('create_public_client', {
      p_company_id: companySettings.company_id,
      p_name: clientName,
      p_phone: clientPhone,
      p_email: formData.clientEmail || null
    });

  if (clientError) {
    console.error('❌ Erro ao criar cliente:', clientError);
    throw new Error(`Erro ao criar cliente: ${clientError.message}`);
  }

  const clientId = clientData;
  console.log('✅ Cliente criado/encontrado:', clientId);

  // Determinar profissional (usar o primeiro ativo se não especificado)
  let professionalId = formData.selectedProfessional;
  if (!professionalId && professionals.length > 0) {
    professionalId = professionals[0].id;
  }

  // Criar agendamento
  console.log('📅 Criando agendamento...');
  const { data: appointmentData, error: appointmentError } = await supabase
    .rpc('create_public_appointment', {
      p_company_id: companySettings.company_id,
      p_client_id: clientId,
      p_service_id: selectedService,
      p_professional_id: professionalId,
      p_appointment_date: selectedDate,
      p_appointment_time: selectedTime,
      p_duration: service.duration
    });

  if (appointmentError) {
    console.error('❌ Erro ao criar agendamento:', appointmentError);
    throw new Error(`Erro ao criar agendamento: ${appointmentError.message}`);
  }

  const appointmentId = appointmentData;
  console.log('✅ Agendamento criado:', appointmentId);

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
