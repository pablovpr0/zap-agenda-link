
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
                ? 'public-bg-primary text-white public-border-primary shadow-md' 
                : 'public-border-primary border-opacity-30 public-primary hover:bg-opacity-10 hover:public-bg-primary'
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
