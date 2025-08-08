
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BookingFormData, CompanySettings, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { checkMonthlyLimit } from '@/utils/monthlyLimitUtils';
import { createAppointment, generateWhatsAppMessage } from '@/services/appointmentService';
import { validateBookingForm } from '@/utils/inputValidation';

export const useBookingSubmission = (
  companySettings: CompanySettings | null,
  services: Service[],
  professionals: Professional[]
) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<any>(null);

  const submitBooking = async (formData: BookingFormData, onTimesRefresh?: () => void) => {
    console.log('🔒 Starting secure booking submission...');
    
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
        console.error('❌ Validation failed:', validation.errors);
        toast({
          title: "Dados inválidos",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return false;
      }
      
      console.log('✅ Input validation passed');
      
      // Use sanitized data
      const sanitizedFormData = {
        ...formData,
        ...validation.sanitizedData
      };
      
      if (!companySettings) {
        console.error('❌ Company settings not found');
        toast({
          title: "Erro",
          description: "Configurações da empresa não encontradas.",
          variant: "destructive",
        });
        return false;
      }

      console.log('🏢 Company settings validated');

      // Check monthly limit with sanitized phone
      console.log('📊 Checking monthly limit...');
      const canBook = await checkMonthlyLimit(
        companySettings.company_id,
        sanitizedFormData.clientPhone,
        companySettings.monthly_appointments_limit
      );
      
      if (!canBook) {
        console.log('❌ Monthly limit reached');
        toast({
          title: "Limite de agendamentos atingido",
          description: `Este cliente já atingiu o limite de ${companySettings.monthly_appointments_limit} agendamentos por mês.`,
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Monthly limit check passed');
      
      // Create appointment with sanitized data
      console.log('🔧 Creating secure appointment...');
      const result = await createAppointment(sanitizedFormData, companySettings, services, professionals);
      
      console.log('✅ Appointment created successfully:', result.appointment?.id);
      
      // Refresh times immediately to remove the booked slot
      if (onTimesRefresh) {
        console.log('🔄 Refreshing available times...');
        onTimesRefresh();
      }

      // Prepare success modal data
      const successData = {
        serviceName: result.service?.name || 'Serviço',
        date: sanitizedFormData.selectedDate,
        time: sanitizedFormData.selectedTime,
        clientName: sanitizedFormData.clientName,
        companyName: companySettings.company_name,
        companyPhone: companySettings.phone
      };

      setSuccessModalData(successData);
      setShowSuccessModal(true);

      // Send WhatsApp message after modal delay
      if (companySettings.phone) {
        console.log('📱 Preparing WhatsApp message...');
        
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
        
        // Delay WhatsApp opening to show modal first
        setTimeout(() => {
          console.log('📲 Opening WhatsApp...');
          window.open(whatsappUrl, '_blank');
        }, 3000); // 3 second delay for modal
      }

      return true;
      
    } catch (error: any) {
      console.error('❌ Secure booking submission failed:', error);
      
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
        // Refresh times when there's a conflict
        if (onTimesRefresh) {
          console.log('🔄 Refreshing times due to conflict...');
          onTimesRefresh();
        }
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

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessModalData(null);
  };

  return {
    submitBooking,
    submitting,
    showSuccessModal,
    successModalData,
    closeSuccessModal
  };
};
