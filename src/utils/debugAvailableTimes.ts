import { supabase } from '@/integrations/supabase/client';

export async function debugAvailableTimesGeneration(
  companyId: string, 
  selectedDate: string, 
  companySettings: any
) {
  console.log('🔍 DEBUG: Available Times Generation');
  console.log('📅 Date selected:', selectedDate);
  const date = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = date.getDay();
  console.log('📅 Day of week:', dayOfWeek);

  // Get daily schedule for this day
  const { data: dailySchedule, error: scheduleError } = await (supabase as any)
    .from('daily_schedules')
    .select('*')
    .eq('company_id', companyId)
    .eq('day_of_week', dayOfWeek);

  console.log('📋 Daily schedules query result:', { dailySchedule, scheduleError });

  if (scheduleError) {
    console.error('❌ Error fetching daily schedule:', scheduleError);
    return null;
  }

  // Find active schedule for this day
  const activeSchedule = dailySchedule?.find((schedule: any) => schedule.is_active);

  if (!activeSchedule) {
    console.log('🚫 No active schedule found for this day');
    console.log('🔄 Falling back to company_settings working hours');
    
    // Fallback to company_settings
    const workingHours = {
      start_time: companySettings.working_hours_start,
      end_time: companySettings.working_hours_end,
      interval: companySettings.appointment_interval,
      lunch_break_enabled: companySettings.lunch_break_enabled,
      lunch_start: companySettings.lunch_start_time,
      lunch_end: companySettings.lunch_end_time
    };

    console.log('⏰ Using company settings:', workingHours);
    return workingHours;
  }

  console.log('✅ Active schedule found:', activeSchedule);
  
  console.log('⏰ Using schedule:', {
    start_time: activeSchedule.start_time,
    end_time: activeSchedule.end_time,
    interval: companySettings.appointment_interval,
    has_lunch_break: activeSchedule.has_lunch_break,
    lunch_start: activeSchedule.lunch_start,
    lunch_end: activeSchedule.lunch_end
  });

  // Use the schedule data for time generation
  const workingHours = {
    start_time: activeSchedule.start_time,
    end_time: activeSchedule.end_time,
    interval: companySettings.appointment_interval,
    lunch_break_enabled: activeSchedule.has_lunch_break,
    lunch_start: activeSchedule.lunch_start,
    lunch_end: activeSchedule.lunch_end
  };

  console.log('🎯 Final working hours config:', workingHours);

  // Generate time slots for debugging
  const timeSlots = [];
  let currentTime = new Date(`1970-01-01T${workingHours.start_time}`);
  const endTime = new Date(`1970-01-01T${workingHours.end_time}`);
  const intervalMs = workingHours.interval * 60 * 1000;

  // Lunch break times
  let lunchStart = null;
  let lunchEnd = null;
  if (workingHours.lunch_break_enabled && workingHours.lunch_start && workingHours.lunch_end) {
    lunchStart = new Date(`1970-01-01T${workingHours.lunch_start}`);
    lunchEnd = new Date(`1970-01-01T${workingHours.lunch_end}`);
  }

  console.log('🍽️ Lunch break config:', { 
    enabled: workingHours.lunch_break_enabled, 
    start: workingHours.lunch_start, 
    end: workingHours.lunch_end,
    lunchStart: lunchStart?.toTimeString().substr(0, 5),
    lunchEnd: lunchEnd?.toTimeString().substr(0, 5)
  });

  while (currentTime < endTime) {
    const timeString = currentTime.toTimeString().substr(0, 5);
    
    // Check if this time is within lunch break
    let isLunchTime = false;
    if (lunchStart && lunchEnd) {
      isLunchTime = currentTime >= lunchStart && currentTime < lunchEnd;
    }

    timeSlots.push({
      time: timeString,
      available: !isLunchTime,
      reason: isLunchTime ? 'lunch_break' : 'available'
    });

    currentTime = new Date(currentTime.getTime() + intervalMs);
  }

  console.log('🕐 Generated time slots:', timeSlots);
  console.log('🚫 Lunch break slots:', timeSlots.filter(slot => !slot.available));
  console.log('✅ Available slots:', timeSlots.filter(slot => slot.available));

  return workingHours;
}

// Legacy export for compatibility
export const debugAvailableTimes = debugAvailableTimesGeneration;

// New function to get available times with proper filtering
export async function getAvailableTimesForDate(
  companyId: string,
  selectedDate: string
) {
  console.log('🔍 Getting available times for:', { companyId, selectedDate });
  
  try {
    // Get company settings
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (!companySettings) {
      console.error('❌ No company settings found');
      return [];
    }

    // Debug the time generation process
    const workingHours = await debugAvailableTimesGeneration(companyId, selectedDate, companySettings);
    
    if (!workingHours) {
      console.log('❌ No working hours configuration found');
      return [];
    }

    // Use the get_available_times function
    const { data: availableTimes, error } = await supabase
      .rpc('get_available_times', {
        p_company_id: companyId,
        p_date: selectedDate,
        p_working_hours_start: workingHours.start_time,
        p_working_hours_end: workingHours.end_time,
        p_appointment_interval: workingHours.interval,
        p_lunch_break_enabled: workingHours.lunch_break_enabled || false,
        p_lunch_start_time: workingHours.lunch_start || '12:00:00',
        p_lunch_end_time: workingHours.lunch_end || '13:00:00'
      });

    if (error) {
      console.error('❌ Error from get_available_times:', error);
      return [];
    }

    const times = availableTimes?.map((item: any) => item.available_time) || [];
    console.log('✅ Final available times:', times);
    
    return times;

  } catch (error) {
    console.error('❌ Error in getAvailableTimesForDate:', error);
    return [];
  }
}