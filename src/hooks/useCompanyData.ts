
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CompanySettings, Profile, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { loadCompanyDataBySlug, fetchActiveProfessionals } from '@/services/publicBookingService';

export const useCompanyData = (companySlug: string) => {
  const { toast } = useToast();
  
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompanyData = async () => {
    console.log('🚀 useCompanyData: Iniciando carregamento para slug:', companySlug);
    
    if (!companySlug || companySlug.trim() === '') {
      console.error('❌ useCompanyData: Slug vazio ou inválido');
      setError('Slug da empresa é obrigatório');
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const { settings, profileData, servicesData } = await loadCompanyDataBySlug(companySlug);
      
      console.log('✅ useCompanyData: Dados carregados com sucesso:', { settings, profileData, servicesData });
      
      // Criar objeto companyData compatível com usePublicBooking
      const companyDataObject = {
        id: settings.company_id,
        company_name: profileData?.company_name || 'Empresa',
        slug: settings.slug,
        phone: settings.phone,
        logo_url: settings.logo_url,
        profile_image_url: profileData?.profile_image_url,
        cover_image_url: settings.cover_image_url, // Adicionando foto de capa
        welcome_message: settings.welcome_message,
        instagram_url: settings.instagram_url,
        working_hours_start: settings.working_hours_start,
        working_hours_end: settings.working_hours_end,
        lunch_break_enabled: settings.lunch_break_enabled,
        lunch_start_time: settings.lunch_start_time,
        lunch_end_time: settings.lunch_end_time,
        working_days: settings.working_days,
        appointment_interval: settings.appointment_interval,
        advance_booking_limit: settings.advance_booking_limit,
        monthly_appointments_limit: settings.monthly_appointments_limit,
        description: settings.description,
        address: settings.address,
        business_type: profileData?.business_type
      };
      
      setCompanyData(companyDataObject);
      
    } catch (error: any) {
      console.error('❌ useCompanyData: Erro ao carregar dados da empresa:', error);
      setError(error.message);
      toast({
        title: "Erro",
        description: `Não foi possível carregar os dados da empresa: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      loadCompanyData();
    }
  }, [companySlug]);

  return {
    companyData,
    loading,
    error,
    refetch: loadCompanyData
  };
};
