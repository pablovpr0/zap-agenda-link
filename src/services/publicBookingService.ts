
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

// Helper function to check if there's enough buffer time between appointments
const hasEnoughBufferTime = (
  proposedStart: Date,
  proposedEnd: Date,
  bookedTimeRanges: Array<{start: string, end: string, duration: number, status: string}>,
  bufferMinutes: number = 5
): boolean => {
  for (const bookedRange of bookedTimeRanges) {
    const bookedStart = new Date(`2000-01-01T${bookedRange.start}:00`);
    const bookedEnd = new Date(`2000-01-01T${bookedRange.end}:00`);
    
    // Check if there's enough buffer before the booked appointment
    const timeBefore = (bookedStart.getTime() - proposedEnd.getTime()) / (1000 * 60);
    if (timeBefore >= 0 && timeBefore < bufferMinutes) {
      return false;
    }
    
    // Check if there's enough buffer after the booked appointment
    const timeAfter = (proposedStart.getTime() - bookedEnd.getTime()) / (1000 * 60);
    if (timeAfter >= 0 && timeAfter < bufferMinutes) {
      return false;
    }
  }
  
  return true;
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
    
    console.log('📅 Day of week calculated:', { selectedDate, dayOfWeek });

    // Get daily schedule for this day
    const { data: dailySchedule, error: scheduleError } = await supabase
      .from('daily_schedules')
      .select('*')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    console.log('📋 Daily schedule query result:', { dailySchedule, scheduleError, dayOfWeek });

    if (scheduleError) {
      console.error('❌ Error fetching daily schedule:', scheduleError);
      return [];
    }

    // Check if day exists and is active
    if (!dailySchedule || !dailySchedule.is_active) {
      console.log('📅 Day is not active or not configured:', { 
        exists: !!dailySchedule, 
        isActive: dailySchedule?.is_active,
        dayOfWeek 
      });
      
      // Fallback: try to get from company_settings
      console.log('🔄 Trying fallback to company_settings...');
      const { data: companySettings, error: settingsError } = await supabase
        .from('company_settings')
        .select('working_days, working_hours_start, working_hours_end, appointment_interval, lunch_break_enabled, lunch_start_time, lunch_end_time')
        .eq('company_id', companyId)
        .single();

      if (settingsError || !companySettings) {
        console.error('❌ Error fetching company settings fallback:', settingsError);
        return [];
      }

      // Check if this day is in working_days
      if (!companySettings.working_days.includes(dayOfWeek)) {
        console.log('📅 Day not in working days:', { dayOfWeek, workingDays: companySettings.working_days });
        return [];
      }

      // Use company settings as fallback
      const fallbackSchedule = {
        start_time: companySettings.working_hours_start,
        end_time: companySettings.working_hours_end,
        has_lunch_break: companySettings.lunch_break_enabled,
        lunch_start: companySettings.lunch_start_time,
        lunch_end: companySettings.lunch_end_time
      };

      console.log('🔄 Using fallback schedule:', fallbackSchedule);

      // Get booked appointments for the date (exclude cancelled appointments)
      const { data: bookedAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, duration, status')
        .eq('company_id', companyId)
        .eq('appointment_date', selectedDate)
        .in('status', ['confirmed', 'completed']); // Only consider confirmed and completed appointments

      if (appointmentsError) {
        console.error('❌ Error fetching booked appointments:', appointmentsError);
        return [];
      }

      // Extract booked times and calculate blocked time ranges
      const bookedTimeRanges = (bookedAppointments || []).map(apt => {
        const startTime = apt.appointment_time.substring(0, 5); // HH:mm
        const duration = apt.duration || 60; // Default 60 minutes
        const startDate = new Date(`2000-01-01T${startTime}:00`);
        const endDate = new Date(startDate.getTime() + duration * 60000);
        const endTime = endDate.toTimeString().substring(0, 5);
        
        return {
          start: startTime,
          end: endTime,
          duration: duration,
          status: apt.status
        };
      });

      console.log('📋 Booked time ranges (fallback):', bookedTimeRanges);

      // Generate available time slots using fallback
      const availableTimes = generateTimeSlots(
        fallbackSchedule.start_time,
        fallbackSchedule.end_time,
        companySettings.appointment_interval || 30,
        serviceDuration || 60,
        bookedTimeRanges,
        fallbackSchedule.has_lunch_break,
        fallbackSchedule.lunch_start,
        fallbackSchedule.lunch_end,
        selectedDate
      );

      console.log('⏰ Available times generated (fallback):', {
        date: selectedDate,
        dayOfWeek,
        schedule: `${fallbackSchedule.start_time}-${fallbackSchedule.end_time}`,
        lunchBreak: fallbackSchedule.has_lunch_break ? `${fallbackSchedule.lunch_start}-${fallbackSchedule.lunch_end}` : 'none',
        bookedCount: bookedTimeRanges.length,
        availableCount: availableTimes.length,
        availableTimes
      });

      return availableTimes;
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

    // Get booked appointments for the date (exclude cancelled appointments)
    const { data: bookedAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_time, duration, status')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .in('status', ['confirmed', 'completed']); // Only consider confirmed and completed appointments

    if (appointmentsError) {
      console.error('❌ Error fetching booked appointments:', appointmentsError);
      return [];
    }

    // Extract booked times and calculate blocked time ranges
    const bookedTimeRanges = (bookedAppointments || []).map(apt => {
      const startTime = apt.appointment_time.substring(0, 5); // HH:mm
      const duration = apt.duration || 60; // Default 60 minutes
      const startDate = new Date(`2000-01-01T${startTime}:00`);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const endTime = endDate.toTimeString().substring(0, 5);
      
      return {
        start: startTime,
        end: endTime,
        duration: duration,
        status: apt.status
      };
    });

    console.log('📋 Booked time ranges:', bookedTimeRanges);

    // Generate available time slots
    const availableTimes = generateTimeSlots(
      dailySchedule.start_time,
      dailySchedule.end_time,
      companySettings.appointment_interval || 30,
      serviceDuration || 60,
      bookedTimeRanges,
      dailySchedule.has_lunch_break,
      dailySchedule.lunch_start,
      dailySchedule.lunch_end,
      selectedDate
    );

    console.log('⏰ Available times generated:', {
      date: selectedDate,
      dayOfWeek,
      schedule: `${dailySchedule.start_time}-${dailySchedule.end_time}`,
      lunchBreak: dailySchedule.has_lunch_break ? `${dailySchedule.lunch_start}-${dailySchedule.lunch_end}` : 'none',
      bookedCount: bookedTimeRanges.length,
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
  bookedTimeRanges: Array<{start: string, end: string, duration: number, status: string}>,
  hasLunchBreak: boolean,
  lunchStart?: string,
  lunchEnd?: string,
  selectedDate?: string
): string[] => {
  console.log('🕐 Generating time slots with params:', {
    startTime,
    endTime,
    interval,
    serviceDuration,
    bookedTimeRanges: bookedTimeRanges.length,
    hasLunchBreak,
    lunchStart,
    lunchEnd,
    selectedDate
  });

  const slots: string[] = [];
  
  // Handle time format - ensure we have HH:mm format
  const normalizeTime = (time: string) => {
    if (time.length === 5) return time; // Already HH:mm
    if (time.length === 8) return time.substring(0, 5); // HH:mm:ss -> HH:mm
    return time;
  };

  const normalizedStartTime = normalizeTime(startTime);
  const normalizedEndTime = normalizeTime(endTime);
  const normalizedLunchStart = lunchStart ? normalizeTime(lunchStart) : null;
  const normalizedLunchEnd = lunchEnd ? normalizeTime(lunchEnd) : null;

  const start = new Date(`2000-01-01T${normalizedStartTime}:00`);
  const end = new Date(`2000-01-01T${normalizedEndTime}:00`);
  
  // Check if this is today and filter past times
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const isToday = selectedDate === today;
  const currentTime = isToday ? now.toTimeString().substring(0, 5) : null;
  
  console.log('🕐 Time range:', { 
    start: start.toTimeString(), 
    end: end.toTimeString(),
    isToday,
    currentTime
  });
  
  let current = new Date(start);
  let slotCount = 0;
  
  while (current < end && slotCount < 50) { // Safety limit
    const timeStr = current.toTimeString().substring(0, 5);
    
    // Skip past times if this is today
    if (isToday && currentTime && timeStr <= currentTime) {
      console.log('⏰ Skipping past time:', timeStr);
      current = new Date(current.getTime() + interval * 60000);
      slotCount++;
      continue;
    }
    
    // Check if service would end before closing time
    const serviceEnd = new Date(current.getTime() + serviceDuration * 60000);
    if (serviceEnd > end) {
      console.log('⏰ Service would end after closing time:', { 
        timeStr, 
        serviceDuration: `${serviceDuration}min`,
        serviceEnd: serviceEnd.toTimeString().substring(0, 5),
        closingTime: end.toTimeString().substring(0, 5)
      });
      break;
    }
    
    // Check if time conflicts with lunch break
    let skipDueToLunch = false;
    if (hasLunchBreak && normalizedLunchStart && normalizedLunchEnd) {
      const lunchStartTime = new Date(`2000-01-01T${normalizedLunchStart}:00`);
      const lunchEndTime = new Date(`2000-01-01T${normalizedLunchEnd}:00`);
      
      if (current >= lunchStartTime && current < lunchEndTime) {
        console.log('🍽️ Time is during lunch break:', timeStr);
        skipDueToLunch = true;
      }
      
      // Check if service would overlap with lunch
      if (current < lunchStartTime && serviceEnd > lunchStartTime) {
        console.log('🍽️ Service would overlap with lunch:', { timeStr, serviceEnd: serviceEnd.toTimeString() });
        skipDueToLunch = true;
      }
    }
    
    if (!skipDueToLunch) {
      // Check if this time slot conflicts with any booked appointments
      let isTimeSlotAvailable = true;
      
      for (const bookedRange of bookedTimeRanges) {
        const bookedStart = new Date(`2000-01-01T${bookedRange.start}:00`);
        const bookedEnd = new Date(`2000-01-01T${bookedRange.end}:00`);
        
        // Check if the new service would overlap with existing appointment
        // More precise overlap detection
        const hasOverlap = (
          (current >= bookedStart && current < bookedEnd) || // New service starts during existing appointment
          (serviceEnd > bookedStart && serviceEnd <= bookedEnd) || // New service ends during existing appointment
          (current <= bookedStart && serviceEnd >= bookedEnd) || // New service completely overlaps existing appointment
          (current < bookedEnd && serviceEnd > bookedStart) // Any overlap at all
        );
        
        if (hasOverlap) {
          console.log('❌ Time conflicts with existing appointment:', {
            proposedSlot: `${timeStr}-${serviceEnd.toTimeString().substring(0, 5)}`,
            serviceDuration: `${serviceDuration}min`,
            existingBooking: `${bookedRange.start}-${bookedRange.end}`,
            existingDuration: `${bookedRange.duration}min`,
            status: bookedRange.status
          });
          isTimeSlotAvailable = false;
          break;
        }
      }
      
      // Additional check for buffer time between appointments
      if (isTimeSlotAvailable) {
        const hasBuffer = hasEnoughBufferTime(current, serviceEnd, bookedTimeRanges);
        if (hasBuffer) {
          slots.push(timeStr);
          console.log('✅ Added available slot:', {
            time: timeStr,
            duration: `${serviceDuration}min`,
            endTime: serviceEnd.toTimeString().substring(0, 5)
          });
        } else {
          console.log('⚠️ Time slot available but insufficient buffer time:', {
            time: timeStr,
            duration: `${serviceDuration}min`,
            endTime: serviceEnd.toTimeString().substring(0, 5)
          });
        }
      }
    }
    
    current = new Date(current.getTime() + interval * 60000);
    slotCount++;
  }
  
  console.log('🕐 Generated slots:', { totalSlots: slots.length, slots });
  return slots;
};
