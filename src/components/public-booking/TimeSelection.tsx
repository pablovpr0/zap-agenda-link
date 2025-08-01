
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
      <div className="space-y-3">
        <Label className="text-black font-medium">Horários Disponíveis</Label>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#19c662]"></div>
          <span className="ml-2 text-gray-600">Carregando horários...</span>
        </div>
      </div>
    );
  }

  if (availableTimes.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-black font-medium">Horários Disponíveis</Label>
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="text-xs border-gray-300 hover:border-[#19c662] hover:text-[#19c662]"
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-black font-medium">Horários Disponíveis</Label>
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-xs border-gray-300 hover:border-[#19c662] hover:text-[#19c662]"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Atualizar
          </Button>
        )}
      </div>
      
      {/* Layout carrossel horizontal */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {availableTimes.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => onTimeSelect(time)}
              className={`
                px-4 py-3 text-sm font-medium rounded-lg border-2 whitespace-nowrap min-w-[80px] transition-all duration-200
                ${selectedTime === time 
                  ? 'bg-[#19c662] text-white border-[#19c662] shadow-md' 
                  : 'bg-white text-black border-gray-300 hover:border-[#19c662] hover:bg-gray-50'
                }
              `}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-[#19c662] text-center mt-2">
        ✅ Apenas horários disponíveis são exibidos
      </div>
    </div>
  );
};

export default TimeSelection;
