
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';

interface WorkingHoursSettingsProps {
  workingHoursStart: string;
  workingHoursEnd: string;
  onWorkingHoursStartChange: (time: string) => void;
  onWorkingHoursEndChange: (time: string) => void;
}

const WorkingHoursSettings = ({ 
  workingHoursStart, 
  workingHoursEnd, 
  onWorkingHoursStartChange, 
  onWorkingHoursEndChange 
}: WorkingHoursSettingsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="workingHoursStart" className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-whatsapp-green" />
          Horário de Início
        </Label>
        <Input
          id="workingHoursStart"
          type="time"
          value={workingHoursStart}
          onChange={(e) => onWorkingHoursStartChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="workingHoursEnd">Horário de Fim</Label>
        <Input
          id="workingHoursEnd"
          type="time"
          value={workingHoursEnd}
          onChange={(e) => onWorkingHoursEndChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
};

export default WorkingHoursSettings;
