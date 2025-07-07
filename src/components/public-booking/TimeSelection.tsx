
import { Label } from '@/components/ui/label';

interface TimeSelectionProps {
  availableTimes: string[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

const TimeSelection = ({ availableTimes, selectedTime, onTimeSelect }: TimeSelectionProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-gray-700 font-medium">Escolha o horário</Label>
      <div className="grid grid-cols-3 gap-2">
        {availableTimes.map((time) => (
          <button
            key={time}
            type="button"
            onClick={() => onTimeSelect(time)}
            className={`
              p-3 text-sm rounded-lg border transition-all duration-200
              ${selectedTime === time 
                ? 'bg-green-500 text-white border-green-500 shadow-md' 
                : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              }
            `}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSelection;
