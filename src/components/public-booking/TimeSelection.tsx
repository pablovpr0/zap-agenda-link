
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimeSelectionProps {
  availableTimes: string[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const TimeSelection = ({ 
  availableTimes, 
  selectedTime, 
  onTimeSelect, 
  isLoading = false,
  onRefresh 
}: TimeSelectionProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-gray-700 font-medium">Escolha o horário</Label>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          <span className="ml-2 text-gray-500">Carregando horários...</span>
        </div>
      </div>
    );
  }

  if (availableTimes.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-gray-700 font-medium">Escolha o horário</Label>
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Atualizar
            </Button>
          )}
        </div>
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Não há horários disponíveis para esta data</p>
          <p className="text-xs mt-1">Tente selecionar outro dia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-gray-700 font-medium">Escolha o horário</Label>
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Atualizar
          </Button>
        )}
      </div>
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
      <div className="text-xs text-green-600 text-center mt-2">
        ✅ Apenas horários disponíveis são exibidos
      </div>
    </div>
  );
};

export default TimeSelection;
