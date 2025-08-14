
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BookingFormData, CompanySettings, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { checkMonthlyLimit, checkIfCompanyIsAdmin } from '@/utils/monthlyLimitUtils';
import { checkSimultaneousBookingLimit, checkIfCompanyIsAdminForSimultaneous } from '@/utils/simultaneousBookingLimit';
import { createAppointment, generateWhatsAppMessage } from '@/services/appointmentService';
import { validateBookingForm } from '@/utils/inputValidation';
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
  const [validationStep, setValidationStep] = useState<string>('');

  const submitBooking = async (formData: BookingFormData) => {
    setSubmitting(true);
    setValidationStep('Validando dados...');
    
    try {
      devLog('🚀 [OTIMIZADO] Iniciando processo de agendamento');

      // Step 1: Input validation and sanitization
      setValidationStep('Verificando dados do formulário...');
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

      // Step 2: Check company admin status
      setValidationStep('Verificando tipo de conta...');
      const isAdminCompany = await checkIfCompanyIsAdmin(companySettings.company_id);
      const isAdminCompanySimultaneous = await checkIfCompanyIsAdminForSimultaneous(companySettings.company_id);
      
      devLog(`👑 Status admin: geral=${isAdminCompany}, simultâneo=${isAdminCompanySimultaneous}`);

      // Step 3: VALIDAÇÃO REFORÇADA - Limite de agendamentos simultâneos
      setValidationStep('Verificando limite de agendamentos simultâneos...');
      const simultaneousCheck = await checkSimultaneousBookingLimit(
        companySettings.company_id,
        sanitizedFormData.clientPhone,
        isAdminCompanySimultaneous
      );
      
      devLog('🔍 Resultado validação simultânea:', simultaneousCheck);
      
      if (!simultaneousCheck.canBook) {
        toast({
          title: "Limite de agendamentos simultâneos atingido",
          description: simultaneousCheck.message || "Você já possui o máximo de agendamentos ativos permitidos.",
          variant: "destructive",
        });
        return false;
      }
      
      // Step 4: VALIDAÇÃO REFORÇADA - Limite mensal
      setValidationStep('Verificando limite mensal...');
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

      // Step 5: VALIDAÇÃO CRÍTICA - Verificar conflito de horário em tempo real
      setValidationStep('Verificando disponibilidade do horário...');
      devLog('🔍 [CRÍTICO] Verificação final de conflito de horário...');
      
      const slotValidation = await validateAppointmentSlot(
        companySettings.company_id,
        sanitizedFormData.selectedDate,
        sanitizedFormData.selectedTime
      );

      if (!slotValidation.isValid) {
        devError('❌ [CRÍTICO] Horário não disponível:', slotValidation.message);
        toast({
          title: "Horário não disponível",
          description: slotValidation.message || "Este horário foi reservado por outro cliente. Por favor, escolha outro horário.",
          variant: "destructive",
        });
        return false;
      }

      // Step 6: DUPLA VALIDAÇÃO via Edge Function
      setValidationStep('Validação final de segurança...');
      try {
        const { data: finalValidation, error: validationError } = await (window as any).supabase.functions.invoke('validate-booking-limits', {
          body: { 
            companyId: companySettings.company_id, 
            clientPhone: sanitizedFormData.clientPhone 
          }
        });

        if (validationError || !finalValidation?.canBook) {
          devError('❌ [DUPLA-VALIDAÇÃO] Falhou na validação final');
          toast({
            title: "Validação de segurança falhou",
            description: "Por favor, verifique seus limites de agendamento e tente novamente.",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        devWarn('⚠️ [DUPLA-VALIDAÇÃO] Erro na validação final - prosseguindo');
      }
      
      // Step 7: Create appointment
      setValidationStep('Criando agendamento...');
      const result = await createAppointment(sanitizedFormData, companySettings, services, professionals);
      
      // Step 8: INVALIDAÇÃO AGRESSIVA DO CACHE
      setValidationStep('Atualizando disponibilidade...');
      const { invalidateTimeSlotsCache } = await import('@/services/publicBookingService');
      
      // Invalidar cache específico da data
      invalidateTimeSlotsCache(companySettings.company_id, sanitizedFormData.selectedDate);
      // Invalidar TODO o cache da empresa
      invalidateTimeSlotsCache(companySettings.company_id);
      
      // Limpar cache do sessionStorage também
      const cacheKey = `${companySettings.company_id}-${sanitizedFormData.selectedDate}`;
      sessionStorage.removeItem(cacheKey);
      sessionStorage.removeItem(`${cacheKey}-time`);
      
      devLog(`🔄 [OTIMIZADO] Cache invalidado agressivamente após agendamento`);
      
      toast({
        title: "Agendamento realizado com sucesso!",
        description: `Agendamento confirmado para ${result.formattedDate} às ${sanitizedFormData.selectedTime}.`,
      });

      // Step 9: Callback para atualização imediata
      if (onBookingSuccess) {
        setTimeout(onBookingSuccess, 100); // Pequeno delay para garantir que o cache foi limpo
      }

      // Step 10: Trigger manual de atualização em tempo real
      window.dispatchEvent(new CustomEvent('bookingUpdate', { 
        detail: { 
          companyId: companySettings.company_id, 
          date: sanitizedFormData.selectedDate,
          time: sanitizedFormData.selectedTime,
          action: 'created'
        } 
      }));

      // Step 11: Send WhatsApp message
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

      devLog('✅ [OTIMIZADO] Agendamento concluído com sucesso');
      return true;
      
    } catch (error: any) {
      devError('❌ [OTIMIZADO] Erro no processo de agendamento:', error);
      
      let errorMessage = "Não foi possível realizar o agendamento. Tente novamente.";
      
      // Handle specific error messages
      if (error.message?.includes('Required parameters cannot be null')) {
        errorMessage = "Todos os campos obrigatórios devem ser preenchidos.";
      } else if (error.message?.includes('Company not found or not active')) {
        errorMessage = "Esta empresa não está mais aceitando agendamentos.";
      } else if (error.message?.includes('Service not found or inactive')) {
        errorMessage = "O serviço selecionado não está mais disponível.";
      } else if (error.message?.includes('Time slot already booked')) {
        errorMessage = "Este horário foi reservado por outro cliente. Por favor, escolha outro horário.";
      } else if (error.message?.includes('Cannot book appointments in the past')) {
        errorMessage = "Não é possível agendar para datas passadas.";
      } else if (error.message?.includes('Name must be between')) {
        errorMessage = "Nome deve ter entre 2 e 100 caracteres.";
      } else if (error.message?.includes('Invalid phone number format')) {
        errorMessage = "Formato de telefone inválido.";
      } else if (error.message?.includes('Muitas tentativas')) {
        errorMessage = error.message;
      } else if (error.message?.includes('limite')) {
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
      setValidationStep('');
    }
  };

  return {
    submitBooking,
    submitting,
    validationStep
  };
};
