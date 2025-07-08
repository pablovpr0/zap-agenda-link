
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
    
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return false;
    }

    if (!companySettings) {
      toast({
        title: "Erro",
        description: "Configurações da empresa não encontradas.",
        variant: "destructive",
      });
      return false;
    }

    // Verificar limite mensal
    const canBook = await checkMonthlyLimit(
      companySettings.company_id,
      clientPhone,
      companySettings.monthly_appointments_limit
    );
    
    if (!canBook) {
      toast({
        title: "Limite de agendamentos atingido",
        description: `Este cliente já atingiu o limite de ${companySettings.monthly_appointments_limit} agendamentos por mês.`,
        variant: "destructive",
      });
      return false;
    }

    setSubmitting(true);

    try {
      const result = await createAppointment(formData, companySettings, services, professionals);
      
      toast({
        title: "Agendamento realizado!",
        description: `Agendamento confirmado para ${result.formattedDate} às ${selectedTime}.`,
      });

      // Enviar mensagem para o profissional via WhatsApp
      if (companySettings.phone) {
        const message = generateWhatsAppMessage(
          clientName,
          clientPhone,
          result.formattedDate,
          selectedTime,
          result.service?.name || 'Não especificado',
          result.professionalName,
          formData.notes
        );

        const cleanPhone = companySettings.phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1000);
      }

      return true;
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível realizar o agendamento. Tente novamente.",
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
