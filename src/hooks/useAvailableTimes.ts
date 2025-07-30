
import { CompanySettings } from '@/types/publicBooking';
import { generateAvailableDates, generateTimeSlots } from '@/utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';

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
      companySettings.appointment_interval
    );
    
    try {
      // Buscar agendamentos existentes para a data
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('company_id', companySettings.company_id)
        .eq('appointment_date', selectedDate)
        .neq('status', 'cancelled');

      if (error) {
        console.error('Erro ao verificar horários disponíveis:', error);
        return times;
      }

      const bookedTimes = (appointments || []).map(apt => apt.appointment_time);
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
