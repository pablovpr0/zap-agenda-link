
import { CompanySettings } from '@/types/publicBooking';
import { generateAvailableDates, generateTimeSlots, isTimeDuringLunch } from '@/utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

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
      // Buscar agendamentos existentes para a data (incluindo status confirmado e pendente)
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('company_id', companySettings.company_id)
        .eq('appointment_date', selectedDate)
        .in('status', ['confirmed', 'pending']); // Incluir agendamentos confirmados e pendentes

      if (error) {
        console.error('Erro ao verificar horários disponíveis:', error);
        return times;
      }

      const bookedTimes = (appointments || []).map(apt => apt.appointment_time);
      
      // Filtrar horários ocupados e durante o almoço
      const availableTimes = times.filter(time => {
        // Verificar se não está ocupado
        if (bookedTimes.includes(time)) {
          return false;
        }
        
        // Verificar se não é horário de almoço
        if (companySettings.lunch_break_enabled && 
            companySettings.lunch_start_time && 
            companySettings.lunch_end_time) {
          return !isTimeDuringLunch(
            time, 
            companySettings.lunch_break_enabled, 
            companySettings.lunch_start_time, 
            companySettings.lunch_end_time
          );
        }
        
        return true;
      });

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
