
import { CompanySettings } from '@/types/publicBooking';
import { generateAvailableDates, generateTimeSlots } from '@/utils/dateUtils';
import { getStorageData, MockAppointment, STORAGE_KEYS } from '@/data/mockData';

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
      const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const bookedTimes = appointments
        .filter(apt => 
          apt.company_id === companySettings.company_id &&
          apt.appointment_date === selectedDate &&
          apt.status !== 'cancelled'
        )
        .map(apt => apt.appointment_time);

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
