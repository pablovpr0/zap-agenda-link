
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from 'lucide-react';

interface WorkingDaysSettingsProps {
  workingDays: number[];
  onWorkingDaysChange: (workingDays: number[]) => void;
}

const WorkingDaysSettings = ({ workingDays, onWorkingDaysChange }: WorkingDaysSettingsProps) => {
  const weekDays = [
    { id: 1, name: 'Segunda-feira' },
    { id: 2, name: 'Terça-feira' },
    { id: 3, name: 'Quarta-feira' },
    { id: 4, name: 'Quinta-feira' },
    { id: 5, name: 'Sexta-feira' },
    { id: 6, name: 'Sábado' },
    { id: 7, name: 'Domingo' },
  ];

  const handleWorkingDayToggle = (dayId: number, checked: boolean) => {
    if (checked) {
      onWorkingDaysChange([...workingDays, dayId]);
    } else {
      onWorkingDaysChange(workingDays.filter(day => day !== dayId));
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-whatsapp-green" />
        Dias de Funcionamento
      </Label>
      <div className="grid grid-cols-2 gap-3">
        {weekDays.map((day) => (
          <div key={day.id} className="flex items-center space-x-2">
            <Checkbox
              id={`day-${day.id}`}
              checked={workingDays.includes(day.id)}
              onCheckedChange={(checked) => handleWorkingDayToggle(day.id, checked as boolean)}
            />
            <Label htmlFor={`day-${day.id}`} className="text-sm">
              {day.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkingDaysSettings;
