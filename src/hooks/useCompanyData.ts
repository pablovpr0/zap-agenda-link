
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CompanySettings, Profile, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { supabase } from '@/integrations/supabase/client';

export const useCompanyData = (companySlug: string) => {
  const { toast } = useToast();
  
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCompanyData = async () => {
    console.log('🚀 useCompanyData: Iniciando carregamento para slug:', companySlug);
    try {
      setLoading(true);

      // Buscar configurações da empresa pelo slug
      const { data: settingsData, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('slug', companySlug)
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching company settings:', settingsError);
        throw new Error('Erro ao buscar configurações da empresa');
      }

      if (!settingsData) {
        throw new Error('Empresa não encontrada');
      }

      // Buscar dados do perfil da empresa
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', settingsData.company_id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching company profile:', profileError);
      }

      // Buscar serviços ativos
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', settingsData.company_id)
        .eq('is_active', true);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      }

      // Buscar profissionais ativos
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('professionals')
        .select('*')
        .eq('company_id', settingsData.company_id)
        .eq('is_active', true);

      if (professionalsError) {
        console.error('Error fetching professionals:', professionalsError);
      }

      console.log('✅ useCompanyData: Dados carregados com sucesso:', { 
        settingsData, 
        profileData, 
        servicesData, 
        professionalsData 
      });
      
      // Converter para os tipos esperados
      const convertedSettings: CompanySettings = {
        company_id: settingsData.company_id,
        company_name: profileData?.company_name || 'Empresa',
        company_phone: settingsData.phone,
        slug: settingsData.slug,
        logo_url: settingsData.logo_url,
        welcome_message: settingsData.welcome_message,
        instagram_url: settingsData.instagram_url,
        working_hours_start: settingsData.working_hours_start,
        working_hours_end: settingsData.working_hours_end,
        lunch_break_enabled: settingsData.lunch_break_enabled || false,
        lunch_start_time: settingsData.lunch_start_time || '',
        lunch_end_time: settingsData.lunch_end_time || '',
        working_days: settingsData.working_days,
        appointment_interval: settingsData.appointment_interval,
        advance_booking_limit: settingsData.advance_booking_limit,
        monthly_appointments_limit: settingsData.monthly_appointments_limit,
        phone: settingsData.phone
      };

      const convertedProfile: Profile = {
        id: profileData?.id || settingsData.company_id,
        company_name: profileData?.company_name || 'Empresa',
        company_description: settingsData.description,
        company_logo: settingsData.logo_url,
        company_address: settingsData.address,
        company_website: '',
        business_type: profileData?.business_type
      };

      const convertedServices: Service[] = (servicesData || []).map(s => ({
        id: s.id,
        name: s.name,
        duration: s.duration,
        price: s.price,
        description: s.description
      }));

      const convertedProfessionals: Professional[] = (professionalsData || []).map(p => ({
        id: p.id,
        company_id: p.company_id,
        name: p.name,
        phone: p.phone,
        whatsapp: p.whatsapp,
        role: p.role,
        is_active: p.is_active
      }));

      setCompanySettings(convertedSettings);
      setProfile(convertedProfile);
      setServices(convertedServices);
      setProfessionals(convertedProfessionals);

      console.log('👥 useCompanyData: Profissionais carregados:', convertedProfessionals);
    } catch (error: any) {
      console.error('❌ useCompanyData: Erro ao carregar dados da empresa:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar os dados da empresa.",
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
    companySettings,
    profile,
    services,
    professionals,
    loading,
    refetch: loadCompanyData
  };
};
