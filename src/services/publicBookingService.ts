
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
  serviceDuration?: number
) => {
  console.log('🔍 Checking available times with daily schedules:', {
    companyId,
    selectedDate,
    serviceDuration
  });

  try {
    // Get day of week (0=Sunday, 1=Monday, etc.)
    const date = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = date.getDay();

    // Get daily schedule for this day
    const { data: dailySchedule, error: scheduleError } = await (supabase as any)
      .from('daily_schedules')
      .select('*')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .maybeSingle();

    if (scheduleError) {
      console.error('❌ Error fetching daily schedule:', scheduleError);
      return [];
    }

    if (!dailySchedule) {
      console.log('📅 No schedule configured for this day or day is closed');
      return [];
    }

    // Get company settings for appointment interval
    const { data: companySettings, error: settingsError } = await supabase
      .from('company_settings')
      .select('appointment_interval')
      .eq('company_id', companyId)
      .single();

    if (settingsError) {
      console.error('❌ Error fetching company settings:', settingsError);
      return [];
    }

    // Get booked appointments for the date
    const { data: bookedAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      console.error('❌ Error fetching booked appointments:', appointmentsError);
      return [];
    }

    // Extract booked times
    const bookedTimes = (bookedAppointments || []).map(apt => 
      apt.appointment_time.substring(0, 5) // HH:mm
    );

    // Generate available time slots
    const availableTimes = generateTimeSlots(
      dailySchedule.start_time,
      dailySchedule.end_time,
      companySettings.appointment_interval || 30,
      serviceDuration || 60,
      bookedTimes,
      dailySchedule.has_lunch_break,
      dailySchedule.lunch_start,
      dailySchedule.lunch_end
    );

    console.log('⏰ Available times generated:', {
      date: selectedDate,
      dayOfWeek,
      schedule: `${dailySchedule.start_time}-${dailySchedule.end_time}`,
      lunchBreak: dailySchedule.has_lunch_break ? `${dailySchedule.lunch_start}-${dailySchedule.lunch_end}` : 'none',
      bookedCount: bookedTimes.length,
      availableCount: availableTimes.length,
      availableTimes
    });

    return availableTimes;

  } catch (error: any) {
    console.error('❌ Failed to check available times:', error);
    return [];
  }
};

// Helper function to generate time slots
const generateTimeSlots = (
  startTime: string,
  endTime: string,
  interval: number,
  serviceDuration: number,
  bookedTimes: string[],
  hasLunchBreak: boolean,
  lunchStart?: string,
  lunchEnd?: string
): string[] => {
  const slots: string[] = [];
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  let current = new Date(start);
  
  while (current < end) {
    const timeStr = current.toTimeString().substring(0, 5);
    
    // Check if service would end before closing time
    const serviceEnd = new Date(current.getTime() + serviceDuration * 60000);
    if (serviceEnd > end) break;
    
    // Check if time conflicts with lunch break
    if (hasLunchBreak && lunchStart && lunchEnd) {
      const lunchStartTime = new Date(`2000-01-01T${lunchStart}:00`);
      const lunchEndTime = new Date(`2000-01-01T${lunchEnd}:00`);
      
      if (current >= lunchStartTime && current < lunchEndTime) {
        current = new Date(current.getTime() + interval * 60000);
        continue;
      }
      
      // Check if service would overlap with lunch
      if (current < lunchStartTime && serviceEnd > lunchStartTime) {
        current = new Date(current.getTime() + interval * 60000);
        continue;
      }
    }
    
    // Check if time is not already booked
    if (!bookedTimes.includes(timeStr)) {
      slots.push(timeStr);
    }
    
    current = new Date(current.getTime() + interval * 60000);
  }
  
  return slots;
};
