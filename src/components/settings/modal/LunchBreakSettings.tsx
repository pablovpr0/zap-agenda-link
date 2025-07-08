
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Coffee } from 'lucide-react';

interface LunchBreakSettingsProps {
  lunchBreakEnabled: boolean;
  lunchStartTime: string;
  lunchEndTime: string;
  onLunchBreakEnabledChange: (enabled: boolean) => void;
  onLunchStartTimeChange: (time: string) => void;
  onLunchEndTimeChange: (time: string) => void;
}

const LunchBreakSettings = ({
  lunchBreakEnabled,
  lunchStartTime,
  lunchEndTime,
  onLunchBreakEnabledChange,
  onLunchStartTimeChange,
  onLunchEndTimeChange
}: LunchBreakSettingsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Coffee className="w-4 h-4 text-whatsapp-green" />
          Horário de Almoço
        </Label>
        <Switch
          checked={lunchBreakEnabled}
          onCheckedChange={onLunchBreakEnabledChange}
        />
      </div>
      
      {lunchBreakEnabled && (
        <div className="grid grid-cols-2 gap-4 pl-6">
          <div className="space-y-2">
            <Label htmlFor="lunchStartTime">Início do Almoço</Label>
            <Input
              id="lunchStartTime"
              type="time"
              value={lunchStartTime}
              onChange={(e) => onLunchStartTimeChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lunchEndTime">Fim do Almoço</Label>
            <Input
              id="lunchEndTime"
              type="time"
              value={lunchEndTime}
              onChange={(e) => onLunchEndTimeChange(e.target.value)}
              required
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LunchBreakSettings;
