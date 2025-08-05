import { supabase } from '@/integrations/supabase/client';

export const debugAvailableTimes = async (companyId: string, selectedDate: string) => {
  console.log('🔍 DEBUG: Checking available times for:', { companyId, selectedDate });

  try {
    // Get day of week (0=Sunday, 1=Monday, etc.)
    const date = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = date.getDay();
    console.log('📅 Day of week:', dayOfWeek);

    // Get daily schedule for this day
    const { data: dailySchedule, error: scheduleError } = await supabase
      .from('daily_schedules')
      .select('*')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek);

    console.log('📋 Daily schedules query result:', { dailySchedule, scheduleError });

    if (scheduleError) {
      console.error('❌ Error fetching daily schedule:', scheduleError);
      return { error: 'Error fetching schedule', details: scheduleError };
    }

    if (!dailySchedule || dailySchedule.length === 0) {
      console.log('📅 No schedule configured for this day');
      return { error: 'No schedule configured', dayOfWeek };
    }

    const activeSchedule = dailySchedule.find(s => s.is_active);
    if (!activeSchedule) {
      console.log('📅 Day is closed (no active schedule)');
      return { error: 'Day is closed', schedules: dailySchedule };
    }

    console.log('✅ Active schedule found:', activeSchedule);

    // Get company settings for appointment interval
    const { data: companySettings, error: settingsError } = await supabase
      .from('company_settings')
      .select('appointment_interval')
      .eq('company_id', companyId);

    console.log('⚙️ Company settings:', { companySettings, settingsError });

    // Get booked appointments for the date
    const { data: bookedAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .neq('status', 'cancelled');

    console.log('📅 Booked appointments:', { bookedAppointments, appointmentsError });

    const bookedTimes = (bookedAppointments || []).map(apt => 
      apt.appointment_time.substring(0, 5)
    );

    console.log('🚫 Booked times:', bookedTimes);

    // Generate time slots
    const interval = companySettings?.[0]?.appointment_interval || 30;
    const serviceDuration = 60; // Default service duration

    console.log('⏰ Generating slots with:', {
      start: activeSchedule.start_time,
      end: activeSchedule.end_time,
      interval,
      serviceDuration,
      hasLunchBreak: activeSchedule.has_lunch_break,
      lunchStart: activeSchedule.lunch_start,
      lunchEnd: activeSchedule.lunch_end
    });

    const availableTimes = generateTimeSlots(
      activeSchedule.start_time,
      activeSchedule.end_time,
      interval,
      serviceDuration,
      bookedTimes,
      activeSchedule.has_lunch_break,
      activeSchedule.lunch_start,
      activeSchedule.lunch_end
    );

    console.log('✅ Generated available times:', availableTimes);

    return {
      success: true,
      dayOfWeek,
      schedule: activeSchedule,
      bookedTimes,
      availableTimes,
      interval,
      serviceDuration
    };

  } catch (error: any) {
    console.error('❌ Debug failed:', error);
    return { error: 'Debug failed', details: error };
  }
};

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
  
  console.log('🔄 Generating slots from', start.toTimeString(), 'to', end.toTimeString());
  
  while (current < end) {
    const timeStr = current.toTimeString().substring(0, 5);
    
    // Check if service would end before closing time
    const serviceEnd = new Date(current.getTime() + serviceDuration * 60000);
    if (serviceEnd > end) {
      console.log('⏰ Service would end after closing time:', timeStr);
      break;
    }
    
    // Check if time conflicts with lunch break
    if (hasLunchBreak && lunchStart && lunchEnd) {
      const lunchStartTime = new Date(`2000-01-01T${lunchStart}:00`);
      const lunchEndTime = new Date(`2000-01-01T${lunchEnd}:00`);
      
      if (current >= lunchStartTime && current < lunchEndTime) {
        console.log('🍽️ Time conflicts with lunch break:', timeStr);
        current = new Date(current.getTime() + interval * 60000);
        continue;
      }
      
      // Check if service would overlap with lunch
      if (current < lunchStartTime && serviceEnd > lunchStartTime) {
        console.log('🍽️ Service would overlap with lunch:', timeStr);
        current = new Date(current.getTime() + interval * 60000);
        continue;
      }
    }
    
    // Check if time is not already booked
    if (!bookedTimes.includes(timeStr)) {
      slots.push(timeStr);
      console.log('✅ Available slot:', timeStr);
    } else {
      console.log('🚫 Slot already booked:', timeStr);
    }
    
    current = new Date(current.getTime() + interval * 60000);
  }
  
  return slots;
};