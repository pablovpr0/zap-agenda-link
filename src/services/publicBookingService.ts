
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings, Profile, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { getNowInBrazil, getTodayInBrazil, getCurrentTimeInBrazil } from '@/utils/timezone';

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
        created_at: getNowInBrazil().toISOString(),
        updated_at: getNowInBrazil().toISOString()
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

// Helper function to generate blocked time slots based on service duration
const generateBlockedTimeSlots = (
  bookedAppointments: Array<{
    appointment_time: string, 
    duration?: number, 
    status: string,
    services?: {duration: number}
  }>
): Set<string> => {
  const blockedSlots = new Set<string>();
  
  for (const appointment of bookedAppointments) {
    const startTime = appointment.appointment_time.substring(0, 5); // HH:mm
    // Use service duration from services table, fallback to appointment duration, then default to 60
    const duration = appointment.services?.duration || appointment.duration || 60;
    
    console.log('🚫 Processing booked appointment:', {
      startTime,
      duration: `${duration}min`,
      status: appointment.status,
      source: appointment.services?.duration ? 'services table' : 'appointment table'
    });
    
    // Convert start time to minutes for easier calculation
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    
    // Block slots based on service duration rules
    if (duration <= 30) {
      // For 30-minute services: block only the selected slot
      blockedSlots.add(startTime);
      console.log(`🚫 Blocked slot for 30min service: ${startTime}`);
    } else if (duration <= 60) {
      // For 60-minute services: block the selected slot + next 30min slot
      blockedSlots.add(startTime);
      
      // Calculate next 30-minute slot
      const nextSlotMinutes = startMinutes + 30;
      const nextHours = Math.floor(nextSlotMinutes / 60);
      const nextMins = nextSlotMinutes % 60;
      const nextSlot = `${nextHours.toString().padStart(2, '0')}:${nextMins.toString().padStart(2, '0')}`;
      
      blockedSlots.add(nextSlot);
      console.log(`🚫 Blocked slots for 60min service: ${startTime}, ${nextSlot}`);
    } else {
      // For services longer than 60 minutes: block all 30-minute intervals
      const slotsToBlock = Math.ceil(duration / 30);
      
      for (let i = 0; i < slotsToBlock; i++) {
        const slotMinutes = startMinutes + (i * 30);
        const slotHours = Math.floor(slotMinutes / 60);
        const slotMins = slotMinutes % 60;
        const slot = `${slotHours.toString().padStart(2, '0')}:${slotMins.toString().padStart(2, '0')}`;
        
        blockedSlots.add(slot);
      }
      
      console.log(`🚫 Blocked ${slotsToBlock} slots for ${duration}min service starting at ${startTime}`);
    }
  }
  
  console.log('🚫 Total blocked slots:', Array.from(blockedSlots).sort());
  return blockedSlots;
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
    // Get day of week (0=Sunday, 1=Monday, etc.) using Brazil timezone
    const date = new Date(selectedDate + 'T12:00:00'); // Use meio-dia para evitar problemas de timezone
    const dayOfWeek = date.getDay();
    
    console.log('📅 Day of week calculated (Brazil timezone):', { selectedDate, dayOfWeek });

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
      // Include service duration from the services table
      const { data: bookedAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          appointment_time, 
          appointments.duration,
          status,
          services!inner(duration)
        `)
        .eq('company_id', companyId)
        .eq('appointment_date', selectedDate)
        .in('status', ['confirmed', 'completed']); // Only consider confirmed and completed appointments

      if (appointmentsError) {
        console.error('❌ Error fetching booked appointments:', appointmentsError);
        return [];
      }

      // Generate blocked time slots using new logic (fallback)
      const blockedSlots = generateBlockedTimeSlots(bookedAppointments || []);

      // Generate available time slots using fallback
      const availableTimes = generateAvailableTimeSlots(
        fallbackSchedule.start_time,
        fallbackSchedule.end_time,
        companySettings.appointment_interval || 30,
        serviceDuration || 60,
        blockedSlots,
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
        bookedCount: (bookedAppointments || []).length,
        blockedSlotsCount: blockedSlots.size,
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
    // Include service duration from the services table
    const { data: bookedAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        appointment_time, 
        appointments.duration,
        status,
        services!inner(duration)
      `)
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .in('status', ['confirmed', 'completed']); // Only consider confirmed and completed appointments

    if (appointmentsError) {
      console.error('❌ Error fetching booked appointments:', appointmentsError);
      return [];
    }

    // Generate blocked time slots based on new logic
    const blockedSlots = generateBlockedTimeSlots(bookedAppointments || []);

    // Generate available time slots using new logic
    const availableTimes = generateAvailableTimeSlots(
      dailySchedule.start_time,
      dailySchedule.end_time,
      companySettings.appointment_interval || 30,
      serviceDuration || 60,
      blockedSlots,
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
      bookedCount: (bookedAppointments || []).length,
      blockedSlotsCount: blockedSlots.size,
      availableCount: availableTimes.length,
      availableTimes
    });

    return availableTimes;

  } catch (error: any) {
    console.error('❌ Failed to check available times:', error);
    return [];
  }
};

// New function to generate available time slots with improved logic
const generateAvailableTimeSlots = (
  startTime: string,
  endTime: string,
  interval: number,
  serviceDuration: number,
  blockedSlots: Set<string>,
  hasLunchBreak: boolean,
  lunchStart?: string,
  lunchEnd?: string,
  selectedDate?: string
): string[] => {
  console.log('🕐 Generating available time slots with new logic:', {
    startTime,
    endTime,
    interval,
    serviceDuration,
    blockedSlotsCount: blockedSlots.size,
    hasLunchBreak,
    lunchStart,
    lunchEnd,
    selectedDate
  });

  const availableSlots: string[] = [];
  
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
  
  // Check if this is today and filter past times (using Brazil timezone)
  const today = getTodayInBrazil();
  const isToday = selectedDate === today;
  const currentTime = isToday ? getCurrentTimeInBrazil() : null;
  
  console.log('🕐 Time check debug:', {
    today,
    selectedDate,
    isToday,
    currentTime,
    comparison: selectedDate === today ? 'SAME DAY' : 'DIFFERENT DAY'
  });
  
  console.log('🕐 Time range (Brazil timezone):', { 
    start: start.toTimeString(), 
    end: end.toTimeString(),
    selectedDate,
    todayInBrazil: today,
    isToday,
    currentTimeInBrazil: currentTime,
    blockedSlotsArray: Array.from(blockedSlots).sort()
  });
  
  let current = new Date(start);
  let slotCount = 0;
  
  // Generate all possible 30-minute slots (fixed interval)
  while (current < end && slotCount < 50) {
    const timeStr = current.toTimeString().substring(0, 5);
    
    // Skip past times if this is today
    if (isToday && currentTime) {
      // Convert times to minutes for better comparison
      const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
      const [slotHours, slotMinutes] = timeStr.split(':').map(Number);
      
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const slotTotalMinutes = slotHours * 60 + slotMinutes;
      
      if (slotTotalMinutes <= currentTotalMinutes) {
        console.log('⏰ Skipping past time:', { timeStr, currentTime, slotTotalMinutes, currentTotalMinutes });
        current = new Date(current.getTime() + 30 * 60000); // Always 30-minute intervals
        slotCount++;
        continue;
      }
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
      // Check if this slot is blocked by existing appointments
      if (blockedSlots.has(timeStr)) {
        console.log('🚫 Slot is blocked by existing appointment:', timeStr);
      } else {
        // Check if the service would require additional slots that are blocked
        let canBookService = true;
        
        if (serviceDuration > 30) {
          // For services longer than 30 minutes, check if subsequent slots are available
          const slotsNeeded = Math.ceil(serviceDuration / 30);
          
          for (let i = 1; i < slotsNeeded; i++) {
            const nextSlotTime = new Date(current.getTime() + (i * 30 * 60000));
            const nextSlotStr = nextSlotTime.toTimeString().substring(0, 5);
            
            if (blockedSlots.has(nextSlotStr)) {
              console.log(`🚫 Cannot book ${serviceDuration}min service at ${timeStr} - slot ${nextSlotStr} is blocked`);
              canBookService = false;
              break;
            }
          }
        }
        
        if (canBookService) {
          availableSlots.push(timeStr);
          console.log('✅ Added available slot:', {
            time: timeStr,
            duration: `${serviceDuration}min`,
            endTime: serviceEnd.toTimeString().substring(0, 5)
          });
        }
      }
    }
    
    current = new Date(current.getTime() + 30 * 60000); // Always 30-minute intervals
    slotCount++;
  }
  
  console.log('🕐 Generated available slots:', { 
    totalSlots: availableSlots.length, 
    slots: availableSlots,
    blockedSlots: Array.from(blockedSlots).sort(),
    params: {
      startTime,
      endTime,
      serviceDuration,
      selectedDate,
      isToday,
      currentTime
    }
  });
  
  if (availableSlots.length === 0) {
    console.warn('⚠️ NO AVAILABLE SLOTS GENERATED! Check the logic above.');
  }
  
  return availableSlots;
};
