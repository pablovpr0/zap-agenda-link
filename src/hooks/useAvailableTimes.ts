
import { CompanySettings } from '@/types/publicBooking';
import { generateAvailableDates, generateTimeSlots } from '@/utils/dateUtils';
import { checkAvailableTimes } from '@/services/publicBookingService';

export const useAvailableTimes = (companySettings: CompanySettings | null) => {
  const generateAvailableDatesForCompany = () => {
    if (!companySettings) return [];
    return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
  };

  const generateAvailableTimesForDate = async (selectedDate: string) => {
    if (!companySettings || !selectedDate) return [];
    
    const times = generateTimeSlots(
      companySettings.working_hours_start,
      companySettings.working_hours_end,
      companySettings.appointment_interval,
      companySettings.lunch_break_enabled,
      companySettings.lunch_start_time,
      companySettings.lunch_end_time
    );
    
    try {
      const bookedTimes = await checkAvailableTimes(
        companySettings.company_id,
        selectedDate,
        companySettings.working_hours_start,
        companySettings.working_hours_end,
        companySettings.appointment_interval,
        companySettings.lunch_break_enabled,
        companySettings.lunch_start_time,
        companySettings.lunch_end_time
      );

      const availableTimes = times.filter(time => !bookedTimes.includes(time));
      return availableTimes;
    } catch (error) {
      console.error('Erro ao verificar horários disponíveis:', error);
      return times;
    }
  };

  return {
    generateAvailableDates: generateAvailableDatesForCompany,
    generateAvailableTimes: generateAvailableTimesForDate
  };
};
