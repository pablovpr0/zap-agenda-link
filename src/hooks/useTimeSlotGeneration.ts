
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes, isBefore, isAfter, isSameDay, parseISO, set } from 'date-fns';
import { TimeSlot } from '@/types/timeSlot';
import { isTimeDuringLunch } from '@/utils/timeSlotUtils';

export const useTimeSlotGeneration = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const generateTimeSlots = async (
    selectedDate: string, 
    companyId: string, 
    serviceId?: string,
    excludeAppointmentId?: string
  ) => {
    setLoading(true);
    try {
      // Buscar configurações da empresa
      const { data: settings } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (!settings) {
        console.error('Configurações da empresa não encontradas');
        return;
      }

      // Buscar duração do serviço selecionado
      let serviceDuration = 60; // duração padrão
      if (serviceId) {
        const { data: service } = await supabase
          .from('services')
          .select('duration')
          .eq('id', serviceId)
          .eq('company_id', companyId)
          .single();
        
        if (service) {
          serviceDuration = service.duration;
        }
      }

      // Buscar agendamentos existentes para a data
      let query = supabase
        .from('appointments')
        .select('appointment_time, duration')
        .eq('company_id', companyId)
        .eq('appointment_date', selectedDate)
        .neq('status', 'cancelled');

      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId);
      }

      const { data: existingAppointments } = await query;

      // Gerar slots de horário baseado nas configurações
      const slots: TimeSlot[] = [];
      const selectedDateObj = new Date(selectedDate + 'T00:00:00');
      const dayOfWeek = selectedDateObj.getDay();
      
      // Verificar se é um dia de trabalho (0 = domingo, 1 = segunda, etc.)
      if (!settings.working_days.includes(dayOfWeek === 0 ? 7 : dayOfWeek)) {
        setTimeSlots([]);
        return;
      }

      // Converter horários de trabalho para objetos Date
      const [startHour, startMinute] = settings.working_hours_start.split(':').map(Number);
      const [endHour, endMinute] = settings.working_hours_end.split(':').map(Number);
      
      let currentTime = set(selectedDateObj, { hours: startHour, minutes: startMinute });
      const endTime = set(selectedDateObj, { hours: endHour, minutes: endMinute });

      while (isBefore(currentTime, endTime)) {
        const timeString = format(currentTime, 'HH:mm');
        
        // Verificar se o horário está disponível
        let available = true;
        let reason = '';

        // Verificar se já passou (apenas para data de hoje)
        const now = new Date();
        if (isSameDay(selectedDateObj, now) && isBefore(currentTime, now)) {
          available = false;
          reason = 'Horário já passou';
        }

        // Verificar se está durante o horário de almoço
        if (available && settings.lunch_break_enabled && 
            isTimeDuringLunch(timeString, settings.lunch_start_time, settings.lunch_end_time)) {
          available = false;
          reason = 'Horário de almoço';
        }

        // Verificar se há tempo suficiente até o fim do expediente
        const slotEndTime = addMinutes(currentTime, serviceDuration);
        if (available && isAfter(slotEndTime, endTime)) {
          available = false;
          reason = 'Tempo insuficiente';
        }

        // Verificar conflitos com agendamentos existentes (inteligência de duração)
        if (available && existingAppointments) {
          const conflict = existingAppointments.some(apt => {
            const aptTime = parseISO(`${selectedDate}T${apt.appointment_time}`);
            const aptEndTime = addMinutes(aptTime, apt.duration);
            const slotEndTime = addMinutes(currentTime, serviceDuration);
            
            // Verifica sobreposição: o novo agendamento conflita se:
            // 1. Começa antes do fim de um agendamento existente E termina depois do início dele
            return (
              (isBefore(currentTime, aptEndTime) && isAfter(slotEndTime, aptTime)) ||
              (isBefore(aptTime, slotEndTime) && isAfter(aptEndTime, currentTime))
            );
          });

          if (conflict) {
            available = false;
            reason = 'Horário ocupado';
          }
        }

        slots.push({
          time: timeString,
          available,
          reason
        });

        currentTime = addMinutes(currentTime, settings.appointment_interval);
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('Erro ao gerar slots de horário:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    timeSlots,
    loading,
    generateTimeSlots
  };
};
