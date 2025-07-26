
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings, Profile, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';

export const loadCompanyDataBySlug = async (companySlug: string) => {
  console.log('🔍 Buscando empresa com slug:', companySlug);
  
  // Buscar configurações da empresa pelo slug
  const { data: settings, error: settingsError } = await supabase
    .from('company_settings')
    .select('*')
    .eq('slug', companySlug)
    .maybeSingle();

  console.log('📊 Resultado da busca company_settings:', { settings, settingsError });

  if (settingsError) throw settingsError;
  if (!settings) throw new Error(`Empresa não encontrada para o slug: ${companySlug}`);

  // Buscar perfil da empresa
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', settings.company_id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profileData) throw new Error(`Perfil da empresa não encontrado para o ID: ${settings.company_id}`);

  // Buscar serviços ativos
  const { data: servicesData, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', settings.company_id)
    .eq('is_active', true)
    .order('name');

  if (servicesError) throw servicesError;

  return {
    settings,
    profileData,
    servicesData: servicesData || []
  };
};

export const fetchActiveProfessionals = async (companyId: string): Promise<Professional[]> => {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const checkAvailableTimes = async (
  companyId: string,
  selectedDate: string,
  workingHoursStart: string,
  workingHoursEnd: string,
  appointmentInterval: number,
  lunchBreakEnabled?: boolean,
  lunchStartTime?: string,
  lunchEndTime?: string
) => {
  const { data: bookedAppointments, error } = await supabase
    .from('appointments')
    .select('appointment_time')
    .eq('company_id', companyId)
    .eq('appointment_date', selectedDate)
    .neq('status', 'cancelled');

  if (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }

  return bookedAppointments?.map(apt => apt.appointment_time.substring(0, 5)) || [];
};
