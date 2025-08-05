
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
      // Use the updated checkAvailableTimes function with daily schedules
      const availableTimes = await checkAvailableTimes(
        companySettings.company_id,
        selectedDate,
        serviceDuration
      );

      console.log('⏰ Horários disponíveis do sistema de horários por dia:', availableTimes);
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
