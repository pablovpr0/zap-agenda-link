
import { useState } from 'react';
import { format, addMinutes, isBefore, isAfter, isSameDay, parseISO, set } from 'date-fns';
import { TimeSlot } from '@/types/timeSlot';
import { isTimeDuringLunch } from '@/utils/timeSlotUtils';
import { supabase } from '@/integrations/supabase/client';

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
    console.log('🔧 Gerando slots de horário para:', { selectedDate, companyId, serviceId });
    
    try {
      // Buscar configurações da empresa com cache otimizado
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (settingsError || !settings) {
        console.error('Configurações da empresa não encontradas:', settingsError);
        setTimeSlots([]);
        return;
      }

      console.log('⚙️ Configurações carregadas:', {
        working_hours_start: settings.working_hours_start,
        working_hours_end: settings.working_hours_end,
        appointment_interval: settings.appointment_interval,
        lunch_break_enabled: settings.lunch_break_enabled
      });

      // Buscar duração do serviço selecionado
      let serviceDuration = 60; // duração padrão
      if (serviceId) {
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('duration, name')
          .eq('id', serviceId)
          .eq('company_id', companyId)
          .maybeSingle();
        
        if (!serviceError && service) {
          serviceDuration = service.duration;
          console.log('🛠️ Serviço encontrado:', service.name, 'Duração:', serviceDuration, 'min');
        }
      }

      // Buscar agendamentos existentes para a data com filtros aprimorados
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, duration, status')
        .eq('company_id', companyId)
        .eq('appointment_date', selectedDate)
        .neq('status', 'cancelled')
        .not('id', 'eq', excludeAppointmentId || '');

      if (appointmentsError) {
        console.error('Erro ao buscar agendamentos existentes:', appointmentsError);
      } else {
        console.log('📋 Agendamentos existentes encontrados:', existingAppointments?.length || 0);
      }

      // Gerar slots de horário baseado nas configurações
      const slots: TimeSlot[] = [];
      const selectedDateObj = new Date(selectedDate + 'T00:00:00');
      const dayOfWeek = selectedDateObj.getDay();
      
      // Verificar se é um dia de trabalho
      if (!settings.working_days.includes(dayOfWeek === 0 ? 7 : dayOfWeek)) {
        console.log('📅 Não é um dia de trabalho:', dayOfWeek);
        setTimeSlots([]);
        return;
      }

      // Converter horários de trabalho para objetos Date
      const [startHour, startMinute] = settings.working_hours_start.split(':').map(Number);
      const [endHour, endMinute] = settings.working_hours_end.split(':').map(Number);
      
      let currentTime = set(selectedDateObj, { hours: startHour, minutes: startMinute });
      const endTime = set(selectedDateObj, { hours: endHour, minutes: endMinute });

      console.log('⏰ Gerando slots de', format(currentTime, 'HH:mm'), 'até', format(endTime, 'HH:mm'));

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
        if (available && settings.lunch_break_enabled && settings.lunch_start_time && settings.lunch_end_time &&
            isTimeDuringLunch(timeString, settings.lunch_start_time, settings.lunch_end_time)) {
          available = false;
          reason = 'Horário de almoço';
          console.log(`🍽️ Slot ${timeString} - horário de almoço`);
        }

        // Verificar se há tempo suficiente até o fim do expediente
        const slotEndTime = addMinutes(currentTime, serviceDuration);
        if (available && isAfter(slotEndTime, endTime)) {
          available = false;
          reason = 'Tempo insuficiente';
        }

        // Verificar conflitos com agendamentos existentes - LÓGICA OTIMIZADA
        if (available && existingAppointments && existingAppointments.length > 0) {
          const conflict = existingAppointments.some(apt => {
            const aptTimeString = apt.appointment_time.substring(0, 5); // HH:mm
            const aptDuration = apt.duration || 60;
            
            // Converter horários para minutos para facilitar comparação
            const [aptHours, aptMinutes] = aptTimeString.split(':').map(Number);
            const aptStartMinutes = aptHours * 60 + aptMinutes;
            
            const [slotHours, slotMinutes] = timeString.split(':').map(Number);
            const slotStartMinutes = slotHours * 60 + slotMinutes;
            
            // LÓGICA DEFINITIVA: Bloquear slots baseado na duração do serviço
            if (aptDuration === 30) {
              // Serviço de 30min: bloqueia apenas o horário exato do agendamento
              if (slotStartMinutes === aptStartMinutes) {
                console.log(`⚠️ Conflito 30min: slot ${timeString} bloqueado por agendamento ${aptTimeString}`);
                return true;
              }
            } else if (aptDuration === 60) {
              // Serviço de 60min: bloqueia o horário do agendamento + próximo slot (30min depois)
              if (slotStartMinutes === aptStartMinutes || slotStartMinutes === aptStartMinutes + 30) {
                console.log(`⚠️ Conflito 60min: slot ${timeString} bloqueado por agendamento ${aptTimeString}`);
                return true;
              }
            } else {
              // Para durações diferentes, calcular quantos slots de 30min bloquear
              const slotsToBlock = Math.ceil(aptDuration / 30);
              for (let i = 0; i < slotsToBlock; i++) {
                const blockedSlotMinutes = aptStartMinutes + (i * 30);
                if (slotStartMinutes === blockedSlotMinutes) {
                  console.log(`⚠️ Conflito ${aptDuration}min: slot ${timeString} bloqueado por agendamento ${aptTimeString}`);
                  return true;
                }
              }
            }
            
            return false;
          });

          if (conflict) {
            available = false;
            reason = 'Horário ocupado';
          }
        }

        if (available) {
          console.log(`✅ Slot ${timeString} disponível`);
        } else {
          console.log(`❌ Slot ${timeString} indisponível - ${reason}`);
        }

        slots.push({
          time: timeString,
          available,
          reason
        });

        currentTime = addMinutes(currentTime, settings.appointment_interval);
      }

      console.log(`🎯 Total de slots gerados: ${slots.length} (${slots.filter(s => s.available).length} disponíveis)`);
      setTimeSlots(slots);
    } catch (error) {
      console.error('Erro ao gerar slots de horário:', error);
      setTimeSlots([]);
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
