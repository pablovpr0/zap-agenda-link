
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings, Profile, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';

export const loadCompanyDataBySlug = async (companySlug: string) => {
  console.log('🔍 Loading company data with secure policies:', companySlug);
  
  if (!companySlug || companySlug.trim() === '') {
    throw new Error('Slug da empresa é obrigatório');
  }
  
  try {
    // The new RLS policy allows anon users to read company_settings where status_aberto = true
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('slug', companySlug.trim())
      .eq('status_aberto', true) // Only get active companies
      .maybeSingle();

    console.log('📊 Company settings result:', { settings, settingsError });

    if (settingsError) {
      console.error('❌ Error loading company settings:', settingsError);
      throw new Error(`Erro ao buscar empresa: ${settingsError.message}`);
    }
    
    if (!settings) {
      console.error('❌ Company not found or not active:', companySlug);
      throw new Error(`Empresa não encontrada ou não está aceitando agendamentos: ${companySlug}`);
    }

    // Load profile data - new RLS policy allows anon users to read profiles for active companies
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', settings.company_id)
      .maybeSingle();

    let profile = profileData;
    
    if (profileError) {
      console.warn('⚠️ Profile loading error (non-critical):', profileError);
    }
    
    if (!profile) {
      console.warn('⚠️ Profile not found, creating minimal profile');
      profile = {
        id: settings.company_id,
        company_name: 'Empresa',
        business_type: 'Serviços',
        profile_image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    // Load services - new RLS policy allows anon users to read active services for active companies
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', settings.company_id)
      .eq('is_active', true) // Only active services
      .order('name');

    if (servicesError) {
      console.warn('⚠️ Services loading error (non-critical):', servicesError);
    }

    console.log('✅ Company data loaded successfully:', {
      company_id: settings.company_id,
      services_count: servicesData?.length || 0
    });

    return {
      settings,
      profileData: profile,
      servicesData: servicesData || []
    };
    
  } catch (error: any) {
    console.error('❌ Failed to load company data:', error);
    throw error;
  }
};

export const fetchActiveProfessionals = async (companyId: string): Promise<Professional[]> => {
  try {
    // New RLS policy allows anon users to read active professionals for active companies
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Error loading professionals:', error);
      throw error;
    }

    console.log('👨‍💼 Professionals loaded:', data?.length || 0);
    return data || [];
    
  } catch (error: any) {
    console.error('❌ Failed to load professionals:', error);
    throw error;
  }
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
  console.log('🔍 Checking available times with secure policies:', { 
    companyId, 
    selectedDate,
    lunchBreakEnabled,
    lunchStartTime,
    lunchEndTime
  });
  
  try {
    // Use the secure database function to get available times
    const { data: availableTimes, error } = await supabase.rpc('get_available_times', {
      p_company_id: companyId,
      p_date: selectedDate,
      p_working_hours_start: workingHoursStart,
      p_working_hours_end: workingHoursEnd,
      p_appointment_interval: appointmentInterval,
      p_lunch_break_enabled: lunchBreakEnabled || false,
      p_lunch_start_time: lunchStartTime || '12:00:00',
      p_lunch_end_time: lunchEndTime || '13:00:00'
    });

    if (error) {
      console.error('❌ Error checking available times:', error);
      return [];
    }

    // Convert time objects to string format and filter out past times for today
    const timeStrings = (availableTimes || []).map(t => {
      if (t.available_time) {
        // Format time to HH:MM
        return t.available_time.toString().substring(0, 5);
      }
      return '';
    }).filter(Boolean);

    // If it's today, filter out past times
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const filteredTimes = timeStrings.filter(time => time > currentTime);
      console.log('⏰ Available times (filtered for today):', filteredTimes.length);
      return filteredTimes;
    }

    console.log('⏰ Available times found:', timeStrings.length);
    return timeStrings;
    
  } catch (error: any) {
    console.error('❌ Failed to check available times:', error);
    return [];
  }
};
