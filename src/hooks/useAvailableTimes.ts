
import { CompanySettings } from '@/types/publicBooking';
import { generateAvailableDates, generateTimeSlots, isTimeDuringLunch } from '@/utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isSameDay, isBefore, parse } from 'date-fns';

export const useAvailableTimes = (companySettings: CompanySettings | null) => {
  const generateAvailableDatesForCompany = () => {
    if (!companySettings) return [];
    return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
  };

  const generateAvailableTimesForDate = async (selectedDate: string) => {
    if (!companySettings || !selectedDate) return [];
    
    console.log('🕐 Gerando horários disponíveis para:', selectedDate);
    console.log('⚙️ Configurações:', {
      working_hours_start: companySettings.working_hours_start,
      working_hours_end: companySettings.working_hours_end,
      appointment_interval: companySettings.appointment_interval,
      lunch_break_enabled: companySettings.lunch_break_enabled,
      lunch_start_time: companySettings.lunch_start_time,
      lunch_end_time: companySettings.lunch_end_time
    });
    
    const times = generateTimeSlots(
      companySettings.working_hours_start,
      companySettings.working_hours_end,
      companySettings.appointment_interval,
      companySettings.lunch_break_enabled,
      companySettings.lunch_start_time,
      companySettings.lunch_end_time
    );
    
    console.log('📅 Horários base gerados:', times.length, 'slots');
    
    try {
      // Buscar agendamentos existentes para a data (incluindo status confirmado e pendente)
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_time, duration, status')
        .eq('company_id', companySettings.company_id)
        .eq('appointment_date', selectedDate)
        .in('status', ['confirmed', 'pending']);

      if (error) {
        console.error('Erro ao verificar horários disponíveis:', error);
        return times;
      }

      const bookedTimes = (appointments || []).map(apt => {
        console.log('📋 Agendamento encontrado:', {
          time: apt.appointment_time,
          duration: apt.duration,
          status: apt.status
        });
        return apt.appointment_time;
      });
      
      console.log('🚫 Horários ocupados:', bookedTimes);
      
      // Data atual para verificar se é hoje
      const now = new Date();
      const selectedDateObj = parseISO(selectedDate + 'T00:00:00');
      const isToday = isSameDay(selectedDateObj, now);
      
      // Filtrar apenas horários realmente disponíveis
      const availableTimes = times.filter(time => {
        // 1. Verificar se não está ocupado
        if (bookedTimes.includes(time)) {
          console.log(`❌ Horário ${time} está ocupado`);
          return false;
        }
        
        // 2. Verificar se não é horário de almoço
        if (companySettings.lunch_break_enabled && 
            companySettings.lunch_start_time && 
            companySettings.lunch_end_time) {
          const isDuringLunch = isTimeDuringLunch(
            time, 
            companySettings.lunch_break_enabled, 
            companySettings.lunch_start_time, 
            companySettings.lunch_end_time
          );
          
          if (isDuringLunch) {
            console.log(`🍽️ Horário ${time} está durante o almoço`);
            return false;
          }
        }
        
        // 3. Verificar se não é um horário que já passou (apenas para hoje)
        if (isToday) {
          const timeToCheck = parse(`${selectedDate} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
          if (isBefore(timeToCheck, now)) {
            console.log(`⏰ Horário ${time} já passou`);
            return false;
          }
        }
        
        console.log(`✅ Horário ${time} está disponível`);
        return true;
      });

      console.log('🎯 Horários finais disponíveis:', availableTimes.length, 'de', times.length);
      return availableTimes;
    } catch (error) {
      console.error('Erro ao verificar horários disponíveis:', error);
      return [];
    }
  };

  return {
    generateAvailableDates: generateAvailableDatesForCompany,
    generateAvailableTimes: generateAvailableTimesForDate
  };
};
