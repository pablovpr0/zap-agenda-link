
import { CompanySettings } from '@/types/publicBooking';
import { generateAvailableDates, generateTimeSlots } from '@/utils/dateUtils';
import { checkAvailableTimes } from '@/services/publicBookingService';
import { supabase } from '@/integrations/supabase/client';

export const useAvailableTimes = (companySettings: CompanySettings | null) => {
  const generateAvailableDatesForCompany = async () => {
    if (!companySettings) {
      return [];
    }
    
    try {
      // Get active days from daily_schedules
      const { data: dailySchedules, error } = await supabase
        .from('daily_schedules')
        .select('day_of_week, is_active')
        .eq('company_id', companySettings.company_id)
        .eq('is_active', true);

      if (error) {
        // Fallback to company_settings working_days
        return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
      }

      const activeDays = dailySchedules?.map(schedule => schedule.day_of_week) || [];
      
      if (activeDays.length === 0) {
        return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
      }
      
      return generateAvailableDates(activeDays, companySettings.advance_booking_limit);
      
    } catch (error) {
      return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
    }
  };

  const generateAvailableTimesForDate = async (selectedDate: string, serviceDuration?: number) => {
    if (!companySettings || !selectedDate) return [];
    
    try {
      // Use the updated checkAvailableTimes function with daily schedules
      const availableTimes = await checkAvailableTimes(
        companySettings.company_id,
        selectedDate,
        serviceDuration
      );

      return availableTimes;
      
    } catch (error) {
      return [];
    }
  };



  return {
    generateAvailableDates: generateAvailableDatesForCompany,
    generateAvailableTimes: generateAvailableTimesForDate
  };
};
