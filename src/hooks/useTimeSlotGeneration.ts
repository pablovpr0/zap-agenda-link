
import { useState } from 'react';
import { format, addMinutes, isBefore, isAfter, isSameDay, parseISO, set } from 'date-fns';
import { TimeSlot } from '@/types/timeSlot';
import { isTimeDuringLunch } from '@/utils/timeSlotUtils';
import { getStorageData, MockCompanySettings, MockAppointment, MockService, STORAGE_KEYS } from '@/data/mockData';

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
      const settings = getStorageData<MockCompanySettings>(STORAGE_KEYS.COMPANY_SETTINGS, null);

      if (!settings) {
        console.error('Configurações da empresa não encontradas');
        return;
      }

      // Buscar duração do serviço selecionado
      let serviceDuration = 60; // duração padrão
      if (serviceId) {
        const services = getStorageData<MockService[]>(STORAGE_KEYS.SERVICES, []);
        const service = services.find(s => s.id === serviceId && s.company_id === companyId);
        
        if (service) {
          serviceDuration = service.duration;
        }
      }

      // Buscar agendamentos existentes para a data
      const allAppointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const existingAppointments = allAppointments.filter(apt => 
        apt.company_id === companyId &&
        apt.appointment_date === selectedDate &&
        apt.status !== 'cancelled' &&
        (!excludeAppointmentId || apt.id !== excludeAppointmentId)
      );

      // Gerar slots de horário baseado nas configurações
      const slots: TimeSlot[] = [];
      const selectedDateObj = new Date(selectedDate + 'T00:00:00');
      const dayOfWeek = selectedDateObj.getDay();
      
      // Verificar se é um dia de trabalho (convertendo para o formato esperado)
      const workingDaysMap = {
        0: 7, // domingo
        1: 1, // segunda
        2: 2, // terça
        3: 3, // quarta
        4: 4, // quinta
        5: 5, // sexta
        6: 6  // sábado
      };
      
      const dayNumber = workingDaysMap[dayOfWeek as keyof typeof workingDaysMap];
      if (!settings.working_days.includes(dayNumber)) {
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
        if (available && settings.lunch_break_enabled && settings.lunch_start_time && settings.lunch_end_time &&
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

        // Verificar conflitos com agendamentos existentes
        if (available && existingAppointments.length > 0) {
          const conflict = existingAppointments.some(apt => {
            const aptTime = parseISO(`${selectedDate}T${apt.appointment_time}`);
            const aptEndTime = addMinutes(aptTime, apt.duration);
            const slotEndTime = addMinutes(currentTime, serviceDuration);
            
            // Verifica sobreposição
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

        currentTime = addMinutes(currentTime, settings.appointment_duration);
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
