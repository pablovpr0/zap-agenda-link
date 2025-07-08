
import { Card } from '@/components/ui/card';
import { TimeSlot } from '@/types/timeSlot';

interface TimeSlotGridProps {
  timeSlots: TimeSlot[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

export const TimeSlotGrid = ({ timeSlots, selectedTime, onTimeSelect }: TimeSlotGridProps) => {
  return (
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
  );
};
