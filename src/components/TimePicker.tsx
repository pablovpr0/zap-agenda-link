
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  onTimeSelect: (time: string) => void;
  selectedTime: string;
}

const TimePicker = ({ onTimeSelect, selectedTime }: TimePickerProps) => {
  // Horários disponíveis (em uma implementação real, viriam da API baseado na agenda do comerciante)
  const availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  // Simular alguns horários ocupados
  const bookedTimes = ['10:00', '14:30', '16:00'];

  return (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        Horários Disponíveis
      </h3>
      
      <div className="grid grid-cols-3 gap-2">
        {availableTimes.map((time) => {
          const isBooked = bookedTimes.includes(time);
          const isSelected = selectedTime === time;
          
          return (
            <Card
              key={time}
              className={`
                p-3 cursor-pointer transition-all hover:shadow-md text-center
                ${isBooked ? 'opacity-40 cursor-not-allowed bg-gray-100' : ''}
                ${isSelected ? 'bg-primary text-white' : ''}
                ${!isBooked && !isSelected ? 'hover:bg-green-50' : ''}
              `}
              onClick={() => !isBooked && onTimeSelect(time)}
            >
              <div className="text-sm font-medium">
                {time}
              </div>
              {isBooked && (
                <div className="text-xs text-gray-500 mt-1">Ocupado</div>
              )}
            </Card>
          );
        })}
      </div>
      
      <div className="text-xs text-gray-500 text-center mt-3">
        💡 Horários em cinza já estão ocupados
      </div>
    </div>
  );
};

export default TimePicker;
