
import { useState } from 'react';
import { TimeSlot } from '@/types/timeSlot';
import { generateAvailableTimeSlots } from '@/services/availableTimesService';
import { devLog, devError } from '@/utils/console';

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
      devLog(`🕐 Gerando slots para ${selectedDate}`);

      // Buscar duração do serviço se fornecido
      let serviceDuration = 60; // Padrão
      if (serviceId) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: service, error: serviceError } = await supabase
            .from('services')
            .select('duration, name')
            .eq('id', serviceId)
            .eq('company_id', companyId)
            .single();
          
          if (!serviceError && service) {
            serviceDuration = service.duration;
            devLog(`💼 Serviço selecionado: ${service.name} (${serviceDuration}min)`);
          }
        } catch (error) {
          devError('⚠️ Erro ao buscar duração do serviço, usando padrão:', error);
        }
      }

      // Gerar horários disponíveis usando o novo serviço otimizado
      const availableSlots = await generateAvailableTimeSlots(
        companyId, 
        selectedDate, 
        serviceDuration
      );

      // Converter para formato esperado pelo componente
      const formattedSlots: TimeSlot[] = availableSlots.map(slot => ({
        time: slot.time,
        available: slot.available,
        reason: slot.reason
      }));

      setTimeSlots(formattedSlots);
      
      const availableCount = formattedSlots.filter(s => s.available).length;
      devLog(`✅ ${formattedSlots.length} slots gerados, ${availableCount} disponíveis`);

    } catch (error) {
      devError('❌ Erro ao gerar time slots:', error);
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
