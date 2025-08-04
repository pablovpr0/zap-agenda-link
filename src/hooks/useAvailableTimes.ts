
import { CompanySettings } from '@/types/publicBooking';
import { generateAvailableDates, generateTimeSlots } from '@/utils/dateUtils';
import { checkAvailableTimes } from '@/services/publicBookingService';

export const useAvailableTimes = (companySettings: CompanySettings | null) => {
  const generateAvailableDatesForCompany = () => {
    if (!companySettings) return [];
    return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
  };

  const generateAvailableTimesForDate = async (selectedDate: string, serviceDuration?: number) => {
    if (!companySettings || !selectedDate) return [];
    
    console.log('🕐 Gerando horários disponíveis para:', { selectedDate, serviceDuration });
    
    try {
      // Buscar horários disponíveis usando a função do banco que já filtra corretamente
      const availableTimes = await checkAvailableTimes(
        companySettings.company_id,
        selectedDate,
        companySettings.working_hours_start,
        companySettings.working_hours_end,
        companySettings.appointment_interval,
        companySettings.lunch_break_enabled,
        companySettings.lunch_start_time,
        companySettings.lunch_end_time,
        serviceDuration
      );

      console.log('⏰ Horários disponíveis do banco:', availableTimes);

      // A função do banco já considera a duração do serviço corretamente
      console.log(`✅ Horários disponíveis para serviço de ${serviceDuration || 60}min:`, availableTimes.length);
      return availableTimes;
      
    } catch (error) {
      console.error('❌ Erro ao verificar horários disponíveis:', error);
      return [];
    }
  };



  return {
    generateAvailableDates: generateAvailableDatesForCompany,
    generateAvailableTimes: generateAvailableTimesForDate
  };
};
