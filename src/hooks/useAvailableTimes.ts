
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
    
    // Gerar todos os horários possíveis (já exclui almoço)
    const allPossibleTimes = generateTimeSlots(
      companySettings.working_hours_start,
      companySettings.working_hours_end,
      companySettings.appointment_interval,
      companySettings.lunch_break_enabled,
      companySettings.lunch_start_time,
      companySettings.lunch_end_time
    );
    
    console.log('⏰ Horários possíveis gerados:', allPossibleTimes.length);
    
    try {
      // Buscar horários já ocupados (incluindo duração dos serviços)
      const blockedTimes = await checkAvailableTimes(
        companySettings.company_id,
        selectedDate,
        companySettings.working_hours_start,
        companySettings.working_hours_end,
        companySettings.appointment_interval,
        companySettings.lunch_break_enabled,
        companySettings.lunch_start_time,
        companySettings.lunch_end_time
      );

      // Filtrar horários disponíveis
      let availableTimes = allPossibleTimes.filter(time => !blockedTimes.includes(time));
      
      // Se temos duração do serviço, verificar se há tempo suficiente
      if (serviceDuration && serviceDuration > companySettings.appointment_interval) {
        availableTimes = availableTimes.filter(time => {
          return hasEnoughTimeForService(time, serviceDuration, allPossibleTimes, blockedTimes);
        });
      }
      
      console.log('✅ Horários disponíveis finais:', availableTimes.length);
      console.log('✅ Horários:', availableTimes);
      
      return availableTimes;
    } catch (error) {
      console.error('❌ Erro ao verificar horários disponíveis:', error);
      return allPossibleTimes;
    }
  };

  // Função auxiliar para verificar se há tempo suficiente para o serviço
  const hasEnoughTimeForService = (
    startTime: string, 
    serviceDuration: number, 
    allTimes: string[], 
    blockedTimes: string[]
  ): boolean => {
    const [hours, minutes] = startTime.split(':').map(Number);
    let currentMinutes = hours * 60 + minutes;
    const endMinutes = currentMinutes + serviceDuration;
    const interval = companySettings?.appointment_interval || 30;
    
    // Verificar se todos os intervalos necessários estão livres
    while (currentMinutes < endMinutes) {
      const checkHours = Math.floor(currentMinutes / 60);
      const checkMins = currentMinutes % 60;
      const checkTime = `${checkHours.toString().padStart(2, '0')}:${checkMins.toString().padStart(2, '0')}`;
      
      // Se o horário está bloqueado
      if (blockedTimes.includes(checkTime)) {
        console.log(`❌ Horário ${checkTime} está bloqueado para serviço de ${serviceDuration}min iniciando às ${startTime}`);
        return false;
      }
      
      currentMinutes += interval;
    }
    
    // Verificar se o horário final não ultrapassa o horário de funcionamento
    const finalHours = Math.floor(endMinutes / 60);
    const finalMins = endMinutes % 60;
    const finalTime = `${finalHours.toString().padStart(2, '0')}:${finalMins.toString().padStart(2, '0')}`;
    
    const workingEndTime = companySettings?.working_hours_end || '18:00';
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
