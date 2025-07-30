
import { supabase } from '@/integrations/supabase/client';
import { Professional } from './professionalsService';

export const loadCompanyDataBySlug = async (companySlug: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const { data: companySettings, error: settingsError } = await supabase
    .from('company_settings')
    .select('*')
    .eq('slug', companySlug)
    .eq('status_aberto', true)
    .maybeSingle();

  if (settingsError) {
    console.error('Erro ao buscar configurações da empresa:', settingsError);
    throw new Error('Erro ao buscar configurações da empresa');
  }

  if (!companySettings) {
    throw new Error('Empresa não encontrada');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', companySettings.company_id)
    .maybeSingle();

  if (profileError) {
    console.error('Erro ao buscar perfil da empresa:', profileError);
    // Não falha se não encontrar o perfil
  }

  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', companySettings.company_id)
    .eq('is_active', true);

  if (servicesError) {
    console.error('Erro ao buscar serviços:', servicesError);
    throw new Error('Erro ao buscar serviços da empresa');
  }

  return {
    companySettings,
    profile,
    services: services || []
  };
};

export const fetchActiveProfessionals = async (companyId: string): Promise<Professional[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const { data: professionals, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (error) {
    console.error('Erro ao buscar profissionais:', error);
    throw new Error('Erro ao buscar profissionais');
  }

  return professionals || [];
};

export const checkAvailableTimes = async (
  companyId: string,
  selectedDate: string,
  selectedService?: string,
  selectedProfessional?: string
) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('company_id', companyId)
    .eq('appointment_date', selectedDate)
    .neq('status', 'cancelled');

  if (error) {
    console.error('Erro ao verificar horários ocupados:', error);
    return [];
  }

  return appointments || [];
};
