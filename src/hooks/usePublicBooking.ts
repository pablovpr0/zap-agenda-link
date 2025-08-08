
import { useCompanyData } from './useCompanyData';
import { useBookingSubmission } from './useBookingSubmission';
import { useAvailableTimes } from './useAvailableTimes';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';

export const usePublicBooking = (companySlug: string) => {
  const { companyData, loading: companyLoading, error } = useCompanyData(companySlug);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Convert companyData to the format expected by other hooks
  const companySettings = companyData ? {
    company_id: companyData.id,
    company_name: companyData.company_name,
    company_phone: companyData.phone,
    slug: companyData.slug || '',
    logo_url: companyData.logo_url,
    welcome_message: companyData.welcome_message,
    instagram_url: companyData.instagram_url,
    working_hours_start: companyData.working_hours_start || '09:00',
    working_hours_end: companyData.working_hours_end || '18:00',
    lunch_break_enabled: companyData.lunch_break_enabled,
    lunch_start_time: companyData.lunch_start_time,
    lunch_end_time: companyData.lunch_end_time,
    working_days: companyData.working_days || [1, 2, 3, 4, 5],
    appointment_interval: companyData.appointment_interval || 30,
    advance_booking_limit: companyData.advance_booking_limit || 30,
    monthly_appointments_limit: companyData.monthly_appointments_limit,
    phone: companyData.phone
  } : null;

  const profile = companyData ? {
    id: companyData.id,
    company_name: companyData.company_name,
    company_description: companyData.description,
    company_logo: companyData.profile_image_url || companyData.logo_url,
    company_address: companyData.address,
    business_type: companyData.business_type
  } : null;

  // Callback para atualizar horários após agendamento
  const handleBookingSuccess = () => {
    console.log('🔄 Agendamento realizado com sucesso, atualizando dados...');
    // Forçar recarregamento das datas disponíveis
    if (companySettings) {
      generateAvailableDates().then(dates => {
        setAvailableDates(dates);
        console.log('✅ Datas disponíveis atualizadas após agendamento');
      });
    }
  };

  const { submitBooking, submitting } = useBookingSubmission(
    companySettings,
    services,
    professionals,
    handleBookingSuccess
  );

  const { generateAvailableDates, generateAvailableTimes } = useAvailableTimes(companySettings);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  // Load available dates when companySettings is available
  useEffect(() => {
    const loadAvailableDates = async () => {
      if (companySettings) {
        console.log('📅 Carregando datas disponíveis...');
        const dates = await generateAvailableDates();
        setAvailableDates(dates);
        console.log('✅ Datas disponíveis carregadas:', dates.length);
      }
    };
    
    loadAvailableDates();
  }, [companySettings, generateAvailableDates]);

  // Fetch services and professionals when companyData is available
  useEffect(() => {
    const fetchServicesAndProfessionals = async () => {
      if (!companyData?.id) return;

      setServicesLoading(true);
      try {
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('company_id', companyData.id)
          .eq('is_active', true);

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        } else {
          setServices(servicesData || []);
        }

        // Fetch professionals
        const { data: professionalsData, error: professionalsError } = await supabase
          .from('professionals')
          .select('*')
          .eq('company_id', companyData.id)
          .eq('is_active', true);

        if (professionalsError) {
          console.error('Error fetching professionals:', professionalsError);
        } else {
          setProfessionals(professionalsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServicesAndProfessionals();
  }, [companyData?.id]);

  return {
    companyData,
    companySettings,
    profile,
    services,
    professionals,
    loading: companyLoading || servicesLoading,
    error,
    submitting,
    availableDates,
    generateAvailableTimes,
    submitBooking
  };
};
