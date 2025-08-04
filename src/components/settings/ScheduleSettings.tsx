
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Coffee } from 'lucide-react';

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
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-base md:text-lg text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          Dias e Horários de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(workingDays).map(([day, config]) => (
          <div key={day} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            {/* Toggle Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-800 min-w-[120px]">
                  {dayNames[day as keyof typeof dayNames]}
                </span>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.active}
                    onCheckedChange={(checked) => 
                      updateWorkingDay(day as keyof WorkingDays, { ...config, active: checked })
                    }
                    className="data-[state=checked]:bg-green-600"
                  />
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    config.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {config.active ? 'ABERTO' : 'FECHADO'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Hours Configuration */}
            {config.active && (
              <div className="space-y-4 ml-4 border-l-2 border-green-200 pl-4">
                {/* Working Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-green-600" />
                      Horário de Abertura
                    </Label>
                    <Input
                      type="time"
                      value={config.start}
                      onChange={(e) => 
                        updateWorkingDay(day as keyof WorkingDays, { ...config, start: e.target.value })
                      }
                      className="text-sm h-9 border-gray-300 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-green-600" />
                      Horário de Fechamento
                    </Label>
                    <Input
                      type="time"
                      value={config.end}
                      onChange={(e) => 
                        updateWorkingDay(day as keyof WorkingDays, { ...config, end: e.target.value })
                      }
                      className="text-sm h-9 border-gray-300 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Lunch Break */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        <Coffee className="w-3 h-3 text-orange-600" />
                        Início do Almoço
                      </Label>
                      <Input
                        type="time"
                        value={config.lunchStart}
                        onChange={(e) => 
                          updateWorkingDay(day as keyof WorkingDays, { ...config, lunchStart: e.target.value })
                        }
                        className="text-sm h-9 border-gray-300 focus:border-green-500"
                        placeholder="12:00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        <Coffee className="w-3 h-3 text-orange-600" />
                        Fim do Almoço
                      </Label>
                      <Input
                        type="time"
                        value={config.lunchEnd}
                        onChange={(e) => 
                          updateWorkingDay(day as keyof WorkingDays, { ...config, lunchEnd: e.target.value })
                        }
                        className="text-sm h-9 border-gray-300 focus:border-green-500"
                        placeholder="14:00"
                      />
                    </div>
                  </div>
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
