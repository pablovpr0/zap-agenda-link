
import { CompanySettings } from '@/types/publicBooking';
import { generateAvailableDates, generateTimeSlots } from '@/utils/dateUtils';
import { checkAvailableTimes } from '@/services/publicBookingService';
import { supabase } from '@/integrations/supabase/client';

export const useAvailableTimes = (companySettings: CompanySettings | null) => {
  const generateAvailableDatesForCompany = async () => {
    if (!companySettings) {
      console.log('❌ CompanySettings não disponível para gerar datas');
      return [];
    }
    
    console.log('🏢 Buscando configurações de daily_schedules para:', companySettings.company_id);
    
    try {
      // Get active days from daily_schedules
      const { data: dailySchedules, error } = await supabase
        .from('daily_schedules')
        .select('day_of_week, is_active')
        .eq('company_id', companySettings.company_id)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Erro ao buscar daily_schedules:', error);
        // Fallback to company_settings working_days
        console.log('🔄 Usando fallback working_days:', companySettings.working_days);
        return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
      }

      const activeDays = dailySchedules?.map(schedule => schedule.day_of_week) || [];
      console.log('✅ Dias ativos encontrados na daily_schedules:', activeDays);
      
      if (activeDays.length === 0) {
        console.log('⚠️ Nenhum dia ativo encontrado, usando fallback');
        return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
      }
      
      return generateAvailableDates(activeDays, companySettings.advance_booking_limit);
      
    } catch (error) {
      console.error('❌ Erro ao gerar datas disponíveis:', error);
      return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
    }
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
