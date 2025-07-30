
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BookingFormData, CompanySettings, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { checkMonthlyLimit } from '@/utils/monthlyLimitUtils';
import { createAppointment, generateWhatsAppMessage } from '@/services/appointmentService';

export const useBookingSubmission = (
  companySettings: CompanySettings | null,
  services: Service[],
  professionals: Professional[]
) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const submitBooking = async (formData: BookingFormData) => {
    const { selectedService, selectedDate, selectedTime, clientName, clientPhone } = formData;
    
    console.log('🚀 Iniciando processo de agendamento...');
    console.log('📋 Dados do formulário:', {
      selectedService,
      selectedDate,
      selectedTime,
      clientName,
      clientPhone: clientPhone ? `${clientPhone.substring(0, 4)}****` : 'não informado'
    });
    
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      console.error('❌ Campos obrigatórios não preenchidos');
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return false;
    }

    if (!companySettings) {
      console.error('❌ Configurações da empresa não encontradas');
      toast({
        title: "Erro",
        description: "Configurações da empresa não encontradas.",
        variant: "destructive",
      });
      return false;
    }

    console.log('🏢 Configurações da empresa validadas:', {
      company_id: companySettings.company_id,
      company_name: companySettings.company_name
    });

    // Verificar limite mensal
    console.log('📊 Verificando limite mensal...');
    const canBook = await checkMonthlyLimit(
      companySettings.company_id,
      clientPhone,
      companySettings.monthly_appointments_limit
    );
    
    if (!canBook) {
      console.log('❌ Limite mensal atingido');
      toast({
        title: "Limite de agendamentos atingido",
        description: `Este cliente já atingiu o limite de ${companySettings.monthly_appointments_limit} agendamentos por mês.`,
        variant: "destructive",
      });
      return false;
    }

    console.log('✅ Limite mensal verificado - OK');
    setSubmitting(true);

    try {
      console.log('🔧 Chamando createAppointment...');
      const result = await createAppointment(formData, companySettings, services, professionals);
      
      console.log('✅ Agendamento criado com sucesso:', result.appointment?.id);
      
      toast({
        title: "Agendamento realizado!",
        description: `Agendamento confirmado para ${result.formattedDate} às ${selectedTime}.`,
      });

      // Enviar mensagem para o profissional via WhatsApp
      if (companySettings.phone) {
        console.log('📱 Preparando mensagem WhatsApp...');
        
        const message = generateWhatsAppMessage(
          clientName,
          clientPhone,
          result.formattedDate,
          selectedTime,
          result.service?.name || 'Não especificado',
          result.professionalName
        );

        const cleanPhone = companySettings.phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
        
        setTimeout(() => {
          console.log('📲 Abrindo WhatsApp...');
          window.open(whatsappUrl, '_blank');
        }, 1000);
      }

      return true;
    } catch (error: any) {
      console.error('❌ Erro detalhado no agendamento:', {
        error: error,
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = "Não foi possível realizar o agendamento. Tente novamente.";
      
      // Personalizar mensagem baseada no tipo de erro
      if (error.message?.includes('row-level security')) {
        errorMessage = "Erro de segurança ao criar o agendamento. Tente novamente.";
      } else if (error.message?.includes('client')) {
        errorMessage = "Erro ao processar dados do cliente. Verifique as informações.";
      } else if (error.message?.includes('appointment')) {
        errorMessage = "Erro ao criar o agendamento. Tente novamente.";
      }
      
      toast({
        title: "Erro no agendamento",
        description: error.message || errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitBooking,
    submitting
  };
};
