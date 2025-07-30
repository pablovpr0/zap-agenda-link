
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings, Profile, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';

export const loadCompanyDataBySlug = async (companySlug: string) => {
  console.log('🔍 Buscando empresa com slug:', companySlug);
  console.log('🔍 Tipo do slug:', typeof companySlug);
  console.log('🔍 Slug vazio?', !companySlug);
  
  if (!companySlug || companySlug.trim() === '') {
    throw new Error('Slug da empresa é obrigatório');
  }
  
  // Buscar configurações da empresa pelo slug
  const { data: settings, error: settingsError } = await supabase
    .from('company_settings')
    .select('*')
    .eq('slug', companySlug.trim())
    .maybeSingle();

  console.log('📊 Resultado da busca company_settings:', { settings, settingsError });
  console.log('📊 Settings encontrado?', !!settings);
  console.log('📊 Erro na busca?', !!settingsError);

  if (settingsError) {
    console.error('❌ Erro ao buscar configurações:', settingsError);
    throw new Error(`Erro ao buscar empresa: ${settingsError.message}`);
  }
  
  if (!settings) {
    console.error('❌ Empresa não encontrada para slug:', companySlug);
    throw new Error(`Empresa não encontrada para o slug: ${companySlug}`);
  }

  // Buscar perfil da empresa (pode não existir, vamos criar um perfil mínimo)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', settings.company_id)
    .maybeSingle();

  let profile = profileData;
  
  if (profileError) {
    console.warn('⚠️ Erro ao buscar perfil (não crítico):', profileError);
  }
  
  if (!profile) {
    console.warn('⚠️ Perfil não encontrado, criando perfil mínimo');
    // Criar um perfil mínimo baseado nas configurações
    profile = {
      id: settings.company_id,
      company_name: 'Empresa',
      business_type: 'Serviços',
      profile_image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Buscar serviços ativos (pode estar vazio)
  const { data: servicesData, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', settings.company_id)
    .eq('is_active', true)
    .order('name');

  if (servicesError) {
    console.warn('⚠️ Erro ao buscar serviços (não crítico):', servicesError);
  }

  return {
    settings,
    profileData: profile,
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
  console.log('🔍 Verificando horários ocupados para:', { companyId, selectedDate });
  
  const { data: bookedAppointments, error } = await supabase
    .from('appointments')
    .select('appointment_time, duration')
    .eq('company_id', companyId)
    .eq('appointment_date', selectedDate)
    .neq('status', 'cancelled');

  if (error) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    return [];
  }

  console.log('📅 Agendamentos encontrados:', bookedAppointments?.length || 0);

  // Criar lista de horários bloqueados incluindo duração dos serviços
  const blockedTimes: string[] = [];
  
  bookedAppointments?.forEach(apt => {
    const startTime = apt.appointment_time.substring(0, 5);
    const duration = apt.duration || 60;
    
    console.log(`🚫 Bloqueando agendamento: ${startTime} (duração: ${duration}min)`);
    
    // Bloquear horário inicial
    blockedTimes.push(startTime);
    
    // Bloquear horários intermediários baseado na duração do serviço
    const [hours, minutes] = startTime.split(':').map(Number);
    let currentMinutes = hours * 60 + minutes;
    const endMinutes = currentMinutes + duration;
    
    // Bloquear todos os intervalos durante a duração do serviço
    while (currentMinutes < endMinutes) {
      currentMinutes += appointmentInterval;
      if (currentMinutes < endMinutes) {
        const blockHours = Math.floor(currentMinutes / 60);
        const blockMins = currentMinutes % 60;
        const blockTime = `${blockHours.toString().padStart(2, '0')}:${blockMins.toString().padStart(2, '0')}`;
        blockedTimes.push(blockTime);
        console.log(`  ⏰ Bloqueando intervalo: ${blockTime}`);
      }
    }
  });

  // Adicionar horários de almoço se habilitado
  if (lunchBreakEnabled && lunchStartTime && lunchEndTime) {
    const lunchStart = lunchStartTime.substring(0, 5);
    const lunchEnd = lunchEndTime.substring(0, 5);
    
    console.log(`🍽️ Bloqueando horário de almoço: ${lunchStart} - ${lunchEnd}`);
    
    const [lunchStartHours, lunchStartMinutes] = lunchStart.split(':').map(Number);
    const [lunchEndHours, lunchEndMinutes] = lunchEnd.split(':').map(Number);
    
    let lunchCurrentMinutes = lunchStartHours * 60 + lunchStartMinutes;
    const lunchEndTotalMinutes = lunchEndHours * 60 + lunchEndMinutes;
    
    // Bloquear todos os intervalos durante o almoço
    while (lunchCurrentMinutes < lunchEndTotalMinutes) {
      const blockHours = Math.floor(lunchCurrentMinutes / 60);
      const blockMins = lunchCurrentMinutes % 60;
      const blockTime = `${blockHours.toString().padStart(2, '0')}:${blockMins.toString().padStart(2, '0')}`;
      blockedTimes.push(blockTime);
      lunchCurrentMinutes += appointmentInterval;
    }
  }

  const uniqueBlockedTimes = [...new Set(blockedTimes)];
  console.log('🚫 Total de horários bloqueados:', uniqueBlockedTimes.length);
  console.log('🚫 Horários bloqueados:', uniqueBlockedTimes.sort());
  
  return uniqueBlockedTimes;
};
