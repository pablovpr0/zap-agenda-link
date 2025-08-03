
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
        companySettings.lunch_end_time
      );

      console.log('⏰ Horários disponíveis do banco:', availableTimes);

      // Se temos duração do serviço maior que o intervalo padrão, verificar se há tempo suficiente
      if (serviceDuration && serviceDuration > companySettings.appointment_interval) {
        const filteredTimes = availableTimes.filter(time => {
          return hasEnoughTimeForService(time, serviceDuration, availableTimes);
        });
        
        console.log('✅ Horários filtrados por duração:', filteredTimes);
        return filteredTimes;
      }
      
      console.log('✅ Horários disponíveis finais:', availableTimes);
      return availableTimes;
      
    } catch (error) {
      console.error('❌ Erro ao verificar horários disponíveis:', error);
      return [];
    }
  };

  // Função auxiliar para verificar se há tempo suficiente para o serviço
  const hasEnoughTimeForService = (
    startTime: string, 
    serviceDuration: number, 
    availableTimes: string[]
  ): boolean => {
    if (!companySettings) return false;
    
    const [hours, minutes] = startTime.split(':').map(Number);
    let currentMinutes = hours * 60 + minutes;
    const endMinutes = currentMinutes + serviceDuration;
    const interval = companySettings.appointment_interval;
    
    // Verificar se há horários disponíveis consecutivos suficientes
    while (currentMinutes < endMinutes) {
      const checkHours = Math.floor(currentMinutes / 60);
      const checkMins = currentMinutes % 60;
      const checkTime = `${checkHours.toString().padStart(2, '0')}:${checkMins.toString().padStart(2, '0')}`;
      
      // Se algum dos intervalos necessários não está disponível
      if (!availableTimes.includes(checkTime)) {
        console.log(`❌ Horário ${checkTime} não disponível para serviço de ${serviceDuration}min iniciando às ${startTime}`);
        return false;
      }
      
      currentMinutes += interval;
    }
    
    // Verificar se o horário final não ultrapassa o horário de funcionamento
    const finalHours = Math.floor(endMinutes / 60);
    const finalMins = endMinutes % 60;
    const finalTime = `${finalHours.toString().padStart(2, '0')}:${finalMins.toString().padStart(2, '0')}`;
    
    const workingEndTime = companySettings.working_hours_end || '18:00';
    if (finalTime > workingEndTime) {
      console.log(`❌ Serviço terminaria após horário de funcionamento: ${finalTime} > ${workingEndTime}`);
      return false;
    }
    
    return true;
  };

  return {
    generateAvailableDates: generateAvailableDatesForCompany,
    generateAvailableTimes: generateAvailableTimesForDate
  };
};
