
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes, isBefore, isAfter, isSameDay, parseISO, set } from 'date-fns';

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface TimeSlotPickerProps {
  selectedDate: string;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  companyId: string;
  serviceId?: string;
  excludeAppointmentId?: string;
}

const TimeSlotPicker = ({ 
  selectedDate, 
  selectedTime, 
  onTimeSelect, 
  companyId, 
  serviceId,
  excludeAppointmentId 
}: TimeSlotPickerProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate && companyId) {
      generateTimeSlots();
    }
  }, [selectedDate, companyId, serviceId]);

  const generateTimeSlots = async () => {
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

        // Verificar se há tempo suficiente até o fim do expediente
        const slotEndTime = addMinutes(currentTime, serviceDuration);
        if (isAfter(slotEndTime, endTime)) {
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

  if (!selectedDate) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Selecione uma data primeiro</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto"></div>
        <p className="mt-2 text-gray-500">Carregando horários...</p>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <X className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Nenhum horário disponível para esta data</p>
        <p className="text-sm">Tente selecionar outro dia</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2">
        <Clock className="w-4 h-4 text-whatsapp-green" />
        Horários Disponíveis
      </h3>
      
      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
        {timeSlots.map((slot) => (
          <Card
            key={slot.time}
            className={`
              p-3 cursor-pointer transition-all text-center text-sm
              ${!slot.available 
                ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-500' 
                : selectedTime === slot.time
                  ? 'bg-whatsapp-green text-white border-whatsapp-green'
                  : 'hover:bg-green-50 hover:border-green-200 border'
              }
            `}
            onClick={() => slot.available && onTimeSelect(slot.time)}
          >
            <div className="font-medium">
              {slot.time}
            </div>
            {!slot.available && slot.reason && (
              <div className="text-xs mt-1 text-gray-400">
                {slot.reason}
              </div>
            )}
          </Card>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        💡 Horários em cinza não estão disponíveis
      </div>
    </div>
  );
};

export default TimeSlotPicker;
