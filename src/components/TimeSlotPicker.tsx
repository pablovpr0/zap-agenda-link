
import { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { TimeSlotPickerProps } from '@/types/timeSlot';
import { useTimeSlotGeneration } from '@/hooks/useTimeSlotGeneration';
import { EmptyStates } from '@/components/time-slot-picker/EmptyStates';
import { TimeSlotGrid } from '@/components/time-slot-picker/TimeSlotGrid';

const TimeSlotPicker = ({ 
  selectedDate, 
  selectedTime, 
  onTimeSelect, 
  companyId, 
  serviceId,
  excludeAppointmentId 
}: TimeSlotPickerProps) => {
  const { timeSlots, loading, generateTimeSlots } = useTimeSlotGeneration();

  useEffect(() => {
    if (selectedDate && companyId) {
      generateTimeSlots(selectedDate, companyId, serviceId, excludeAppointmentId);
    }
  }, [selectedDate, companyId, serviceId, excludeAppointmentId]);

  if (!selectedDate) {
    return <EmptyStates type="no-date" />;
  }

  if (loading) {
    return <EmptyStates type="loading" />;
  }

  if (timeSlots.length === 0) {
    return <EmptyStates type="no-slots" />;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2">
        <Clock className="w-4 h-4 text-whatsapp-green" />
        Horários Disponíveis
      </h3>
      
      <TimeSlotGrid 
        timeSlots={timeSlots}
        selectedTime={selectedTime}
        onTimeSelect={onTimeSelect}
      />
      
      <div className="text-xs text-gray-500 text-center">
        💡 Horários em cinza não estão disponíveis
      </div>
    </div>
  );
};

export default TimeSlotPicker;
