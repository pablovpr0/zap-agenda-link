
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CompanySettings, Profile, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { getStorageData, MockCompanySettings, MockProfile, MockService, MockProfessional, STORAGE_KEYS } from '@/data/mockData';

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
      // Buscar configurações da empresa pelo slug
      const settings = getStorageData<MockCompanySettings>(STORAGE_KEYS.COMPANY_SETTINGS, null);
      const profileData = getStorageData<MockProfile>(STORAGE_KEYS.PROFILE, null);
      const servicesData = getStorageData<MockService[]>(STORAGE_KEYS.SERVICES, []);
      const professionalsData = getStorageData<MockProfessional[]>(STORAGE_KEYS.PROFESSIONALS, []);

      if (!settings || settings.company_slug !== companySlug) {
        throw new Error('Empresa não encontrada');
      }
      
      console.log('✅ useCompanyData: Dados carregados com sucesso:', { settings, profileData, servicesData });
      
      // Converter para os tipos esperados
      const convertedSettings: CompanySettings = {
        company_id: settings.company_id,
        company_name: settings.company_name,
        company_phone: settings.company_phone,
        slug: settings.company_slug,
        working_hours_start: settings.working_hours_start,
        working_hours_end: settings.working_hours_end,
        lunch_break_enabled: settings.lunch_break_enabled || false,
        lunch_start_time: settings.lunch_break_start || '',
        lunch_end_time: settings.lunch_break_end || '',
        working_days: settings.working_days,
        appointment_interval: settings.appointment_duration,
        advance_booking_limit: settings.advance_booking_days
      };

      const convertedProfile: Profile = {
        id: profileData?.id || settings.company_id,
        company_name: profileData?.company_name || settings.company_name,
        company_description: profileData?.company_description,
        company_logo: profileData?.company_logo,
        company_address: profileData?.company_address,
        company_website: profileData?.company_website
      };

      const convertedServices: Service[] = servicesData
        .filter(s => s.company_id === settings.company_id && s.is_active)
        .map(s => ({
          id: s.id,
          name: s.name,
          duration: s.duration,
          price: s.price,
          description: s.description
        }));

      const convertedProfessionals: Professional[] = professionalsData
        .filter(p => p.company_id === settings.company_id && p.is_active)
        .map(p => ({
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
        description: "Não foi possível carregar os dados da empresa.",
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
