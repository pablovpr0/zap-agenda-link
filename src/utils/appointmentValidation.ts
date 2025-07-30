import { supabase } from '@/integrations/supabase/client';

export interface AppointmentConflict {
  hasConflict: boolean;
  conflictDetails?: {
    existingAppointmentTime: string;
    existingServiceName: string;
    existingClientName: string;
  };
}

export const validateAppointmentSlot = async (
  companyId: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceDuration: number
): Promise<AppointmentConflict> => {
  try {
    console.log('🔍 Validando slot de agendamento:', {
      companyId,
      appointmentDate,
      appointmentTime,
      serviceDuration
    });

    // Buscar todos os agendamentos do dia que não foram cancelados
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select(`
        appointment_time,
        duration,
        services!inner(name),
        clients!inner(name)
      `)
      .eq('company_id', companyId)
      .eq('appointment_date', appointmentDate)
      .neq('status', 'cancelled');

    if (error) {
      console.error('❌ Erro ao validar slot:', error);
      throw error;
    }

    if (!existingAppointments || existingAppointments.length === 0) {
      console.log('✅ Nenhum agendamento existente, slot disponível');
      return { hasConflict: false };
    }

    // Converter horário do novo agendamento para minutos
    const [newHours, newMinutes] = appointmentTime.split(':').map(Number);
    const newStartMinutes = newHours * 60 + newMinutes;
    const newEndMinutes = newStartMinutes + serviceDuration;

    console.log('🕐 Novo agendamento:', {
      start: `${newHours}:${newMinutes.toString().padStart(2, '0')}`,
      end: `${Math.floor(newEndMinutes / 60)}:${(newEndMinutes % 60).toString().padStart(2, '0')}`,
      duration: serviceDuration
    });

    // Verificar conflitos com agendamentos existentes
    for (const existing of existingAppointments) {
      const existingTime = existing.appointment_time.substring(0, 5);
      const [existingHours, existingMins] = existingTime.split(':').map(Number);
      const existingStartMinutes = existingHours * 60 + existingMins;
      const existingEndMinutes = existingStartMinutes + (existing.duration || 60);

      console.log('🔍 Verificando conflito com:', {
        existing: existingTime,
        duration: existing.duration,
        service: existing.services?.name,
        client: existing.clients?.name
      });

      // Verificar sobreposição de horários
      const hasOverlap = (
        (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes)
      );

      if (hasOverlap) {
        console.log('❌ Conflito detectado!');
        return {
          hasConflict: true,
          conflictDetails: {
            existingAppointmentTime: existingTime,
            existingServiceName: existing.services?.name || 'Serviço',
            existingClientName: existing.clients?.name || 'Cliente'
          }
        };
      }
    }

    console.log('✅ Nenhum conflito detectado, slot disponível');
    return { hasConflict: false };

  } catch (error) {
    console.error('❌ Erro na validação de slot:', error);
    // Em caso de erro, assumir que há conflito para segurança
    return { hasConflict: true };
  }
};

export const getAlternativeSlots = async (
  companyId: string,
  appointmentDate: string,
  serviceDuration: number,
  workingHoursStart: string,
  workingHoursEnd: string,
  appointmentInterval: number
): Promise<string[]> => {
  try {
    // Gerar todos os slots possíveis do dia
    const allSlots: string[] = [];
    const [startHour, startMinute] = workingHoursStart.split(':').map(Number);
    const [endHour, endMinute] = workingHoursEnd.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    while (currentMinutes + serviceDuration <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const timeSlot = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      allSlots.push(timeSlot);
      currentMinutes += appointmentInterval;
    }

    // Filtrar slots disponíveis
    const availableSlots: string[] = [];
    
    for (const slot of allSlots) {
      const validation = await validateAppointmentSlot(companyId, appointmentDate, slot, serviceDuration);
      if (!validation.hasConflict) {
        availableSlots.push(slot);
      }
    }

    return availableSlots.slice(0, 5); // Retornar apenas 5 alternativas
    
  } catch (error) {
    console.error('❌ Erro ao buscar slots alternativos:', error);
    return [];
  }
};