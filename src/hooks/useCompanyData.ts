
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
