import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BookingFormData, CompanySettings, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { checkMonthlyLimit, checkIfCompanyIsAdmin } from '@/utils/monthlyLimitUtils';
import { checkSimultaneousBookingLimit, checkIfCompanyIsAdminForSimultaneous } from '@/utils/simultaneousBookingLimit';
import { createAppointment, generateWhatsAppMessage } from '@/services/appointmentService';
import { validateBookingForm } from '@/utils/inputValidation';
import { triggerBookingUpdate } from '@/utils/realtimeBookingSync';
import { validateAppointmentSlot } from '@/utils/appointmentConflictChecker';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

export const useBookingSubmission = (
  companySettings: CompanySettings | null,
  services: Service[],
  professionals: Professional[],
  onBookingSuccess?: () => void
) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const submitBooking = async (formData: BookingFormData) => {
    setSubmitting(true);
    
    try {
      // Input validation and sanitization
      const validation = validateBookingForm({
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientEmail: formData.clientEmail,
        selectedDate: formData.selectedDate,
        selectedTime: formData.selectedTime,
        selectedService: formData.selectedService,
        selectedProfessional: formData.selectedProfessional
      });
      
      if (!validation.isValid) {
        toast({
          title: "Dados inválidos",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return false;
      }
      
      // Use sanitized data
      const sanitizedFormData = {
        ...formData,
        ...validation.sanitizedData
      };
      
      if (!companySettings) {
        toast({
          title: "Erro",
          description: "Configurações da empresa não encontradas.",
          variant: "destructive",
        });
        return false;
      }

      // Check if company is admin
      const isAdminCompany = await checkIfCompanyIsAdmin(companySettings.company_id);
      const isAdminCompanySimultaneous = await checkIfCompanyIsAdminForSimultaneous(companySettings.company_id);
      
      // VALIDAÇÃO 1: Limite de agendamentos simultâneos
      const simultaneousCheck = await checkSimultaneousBookingLimit(
        companySettings.company_id,
        sanitizedFormData.clientPhone,
        isAdminCompanySimultaneous
      );
      
      if (!simultaneousCheck.canBook) {
        toast({
          title: "Limite de agendamentos simultâneos atingido",
          description: simultaneousCheck.message || "Você já possui o máximo de agendamentos ativos permitidos.",
          variant: "destructive",
        });
        return false;
      }
      
      // VALIDAÇÃO 2: Limite mensal
      const canBook = await checkMonthlyLimit(
        companySettings.company_id,
        sanitizedFormData.clientPhone,
        companySettings.monthly_appointments_limit,
        isAdminCompany
      );
      
      if (!canBook) {
        toast({
          title: "Limite de agendamentos mensais atingido",
          description: `Este cliente já atingiu o limite de ${companySettings.monthly_appointments_limit} agendamentos por mês.`,
          variant: "destructive",
        });
        return false;
      }

      // VALIDAÇÃO FINAL: Verificar conflito de horário em tempo real
      devLog('🔍 Verificação final de conflito de horário...');
      const slotValidation = await validateAppointmentSlot(
        companySettings.company_id,
        sanitizedFormData.selectedDate,
        sanitizedFormData.selectedTime
      );

      if (!slotValidation.isValid) {
        toast({
          title: "Horário não disponível",
          description: slotValidation.message || "Este horário não está mais disponível.",
          variant: "destructive",
        });
        return false;
      }
      
      // Create appointment with sanitized data
      const result = await createAppointment(sanitizedFormData, companySettings, services, professionals);
      
      // SINCRONIZAÇÃO EM TEMPO REAL: Notificar todos os clientes conectados
      triggerBookingUpdate(companySettings.company_id, sanitizedFormData.selectedDate);
      
      // CORREÇÃO: Invalidar TODO o cache da empresa após agendamento público
      const { invalidateTimeSlotsCache } = await import('@/services/publicBookingService');
      invalidateTimeSlotsCache(companySettings.company_id); // Sem data = invalida tudo
      devLog(`🔄 [CORREÇÃO] TODO cache de horários invalidado após agendamento público`);
      
      toast({
        title: "Agendamento realizado com sucesso!",
        description: `Agendamento confirmado para ${result.formattedDate} às ${sanitizedFormData.selectedTime}.`,
      });

      // Callback para atualizar horários disponíveis
      if (onBookingSuccess) {
        onBookingSuccess();
      }

      // Send WhatsApp message with sanitized data
      if (companySettings.phone) {
        
        const message = generateWhatsAppMessage(
          sanitizedFormData.clientName,
          sanitizedFormData.clientPhone,
          result.formattedDate,
          sanitizedFormData.selectedTime,
          result.service?.name || 'Não especificado',
          result.professionalName
        );

        const cleanPhone = companySettings.phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
        
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1000);
      }

      return true;
      
    } catch (error: any) {
      
      let errorMessage = "Não foi possível realizar o agendamento. Tente novamente.";
      
      // Handle specific error messages from database functions
      if (error.message?.includes('Required parameters cannot be null')) {
        errorMessage = "Todos os campos obrigatórios devem ser preenchidos.";
      } else if (error.message?.includes('Company not found or not active')) {
        errorMessage = "Esta empresa não está mais aceitando agendamentos.";
      } else if (error.message?.includes('Service not found or inactive')) {
        errorMessage = "O serviço selecionado não está mais disponível.";
      } else if (error.message?.includes('Time slot already booked')) {
        errorMessage = "Este horário não está mais disponível. Por favor, escolha outro horário.";
      } else if (error.message?.includes('Cannot book appointments in the past')) {
        errorMessage = "Não é possível agendar para datas passadas.";
      } else if (error.message?.includes('Name must be between')) {
        errorMessage = "Nome deve ter entre 2 e 100 caracteres.";
      } else if (error.message?.includes('Invalid phone number format')) {
        errorMessage = "Formato de telefone inválido.";
      } else if (error.message?.includes('Muitas tentativas')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro no agendamento",
        description: errorMessage,
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
