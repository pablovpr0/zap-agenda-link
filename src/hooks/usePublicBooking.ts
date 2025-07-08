
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CompanySettings, Profile, Service, BookingFormData } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { loadCompanyDataBySlug, fetchActiveProfessionals, checkAvailableTimes } from '@/services/publicBookingService';
import { generateAvailableDates, generateTimeSlots } from '@/utils/dateUtils';
import { checkMonthlyLimit } from '@/utils/monthlyLimitUtils';
import { createAppointment, generateWhatsAppMessage } from '@/services/appointmentService';

export const usePublicBooking = (companySlug: string) => {
  const { toast } = useToast();
  
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadCompanyData = async () => {
    try {
      const { settings, profileData, servicesData } = await loadCompanyDataBySlug(companySlug);
      
      setCompanySettings(settings);
      setProfile(profileData);
      setServices(servicesData);

      // Buscar profissionais ativos
      const professionalsData = await fetchActiveProfessionals(settings.company_id);
      setProfessionals(professionalsData);
    } catch (error: any) {
      console.error('Erro ao carregar dados da empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableDatesForCompany = () => {
    if (!companySettings) return [];
    return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
  };

  const generateAvailableTimes = async (selectedDate: string) => {
    if (!companySettings || !selectedDate) return [];
    
    const times = generateTimeSlots(
      companySettings.working_hours_start,
      companySettings.working_hours_end,
      companySettings.appointment_interval,
      companySettings.lunch_break_enabled,
      companySettings.lunch_start_time,
      companySettings.lunch_end_time
    );
    
    try {
      const bookedTimes = await checkAvailableTimes(
        companySettings.company_id,
        selectedDate,
        companySettings.working_hours_start,
        companySettings.working_hours_end,
        companySettings.appointment_interval,
        companySettings.lunch_break_enabled,
        companySettings.lunch_start_time,
        companySettings.lunch_end_time
      );

      const availableTimes = times.filter(time => !bookedTimes.includes(time));
      return availableTimes;
    } catch (error) {
      console.error('Erro ao verificar horários disponíveis:', error);
      return times;
    }
  };

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

    // Verificar limite mensal
    const canBook = await checkMonthlyLimit(
      companySettings!.company_id,
      clientPhone,
      companySettings!.monthly_appointments_limit
    );
    
    if (!canBook) {
      toast({
        title: "Limite de agendamentos atingido",
        description: `Este cliente já atingiu o limite de ${companySettings!.monthly_appointments_limit} agendamentos por mês.`,
        variant: "destructive",
      });
      return false;
    }

    setSubmitting(true);

    try {
      const result = await createAppointment(formData, companySettings!, services, professionals);
      
      toast({
        title: "Agendamento realizado!",
        description: `Agendamento confirmado para ${result.formattedDate} às ${selectedTime}.`,
      });

      // Enviar mensagem para o profissional via WhatsApp
      if (companySettings?.phone) {
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

  useEffect(() => {
    if (companySlug) {
      loadCompanyData();
    }
  }, [companySlug]);

  return {
    companySettings,
    profile,
    services,
    professionals,
    loading,
    submitting,
    generateAvailableDates: generateAvailableDatesForCompany,
    generateAvailableTimes,
    submitBooking
  };
};
