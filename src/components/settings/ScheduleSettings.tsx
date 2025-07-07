
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface WorkingDay {
  active: boolean;
  start: string;
  end: string;
  lunchStart: string;
  lunchEnd: string;
}

interface WorkingDays {
  monday: WorkingDay;
  tuesday: WorkingDay;
  wednesday: WorkingDay;
  thursday: WorkingDay;
  friday: WorkingDay;
  saturday: WorkingDay;
  sunday: WorkingDay;
}

interface ScheduleSettingsProps {
  workingDays: WorkingDays;
  onWorkingDaysChange: (workingDays: WorkingDays) => void;
}

const ScheduleSettings = ({ workingDays, onWorkingDaysChange }: ScheduleSettingsProps) => {
  const dayNames = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  const updateWorkingDay = (day: keyof WorkingDays, config: WorkingDay) => {
    onWorkingDaysChange({
      ...workingDays,
      [day]: config
    });
  };

  return (
    <Card className="bg-white border-whatsapp">
      <CardHeader>
        <CardTitle className="text-base md:text-lg text-gray-800">Dias e Horários de Funcionamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(workingDays).map(([day, config]) => (
          <div key={day} className="p-3 border border-whatsapp rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.active}
                onCheckedChange={(checked) => 
                  updateWorkingDay(day as keyof WorkingDays, { ...config, active: checked })
                }
              />
              <span className="text-sm font-medium text-gray-800">{dayNames[day as keyof typeof dayNames]}</span>
            </div>
            
            {config.active && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Início</Label>
                  <Input
                    type="time"
                    value={config.start}
                    onChange={(e) => 
                      updateWorkingDay(day as keyof WorkingDays, { ...config, start: e.target.value })
                    }
                    className="border-whatsapp text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Fim</Label>
                  <Input
                    type="time"
                    value={config.end}
                    onChange={(e) => 
                      updateWorkingDay(day as keyof WorkingDays, { ...config, end: e.target.value })
                    }
                    className="border-whatsapp text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Almoço início</Label>
                  <Input
                    type="time"
                    value={config.lunchStart}
                    onChange={(e) => 
                      updateWorkingDay(day as keyof WorkingDays, { ...config, lunchStart: e.target.value })
                    }
                    className="border-whatsapp text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Almoço fim</Label>
                  <Input
                    type="time"
                    value={config.lunchEnd}
                    onChange={(e) => 
                      updateWorkingDay(day as keyof WorkingDays, { ...config, lunchEnd: e.target.value })
                    }
                    className="border-whatsapp text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ScheduleSettings;
