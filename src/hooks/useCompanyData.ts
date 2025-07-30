
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CompanySettings, Profile, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { loadCompanyDataBySlug, fetchActiveProfessionals } from '@/services/publicBookingService';

export const useCompanyData = (companySlug: string) => {
  const { toast } = useToast();
  
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCompanyData = async () => {
    console.log('🚀 useCompanyData: Iniciando carregamento para slug:', companySlug);
    
    if (!companySlug || companySlug.trim() === '') {
      console.error('❌ useCompanyData: Slug vazio ou inválido');
      setLoading(false);
      return;
    }
    
    try {
      const { settings, profileData, servicesData } = await loadCompanyDataBySlug(companySlug);
      
      console.log('✅ useCompanyData: Dados carregados com sucesso:', { settings, profileData, servicesData });
      
      setCompanySettings(settings);
      setProfile(profileData);
      setServices(servicesData);

      // Buscar profissionais ativos (opcional, pode falhar)
      try {
        const professionalsData = await fetchActiveProfessionals(settings.company_id);
        console.log('👥 useCompanyData: Profissionais carregados:', professionalsData);
        setProfessionals(professionalsData);
      } catch (profError) {
        console.warn('⚠️ useCompanyData: Erro ao carregar profissionais (não crítico):', profError);
        setProfessionals([]);
      }
      
    } catch (error: any) {
      console.error('❌ useCompanyData: Erro ao carregar dados da empresa:', error);
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
    companySettings,
    profile,
    services,
    professionals,
    loading,
    refetch: loadCompanyData
  };
};
