
import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimeSelectionProps {
  availableTimes: string[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  autoRefreshInterval?: number; // Intervalo em ms para atualização automática
}

const TimeSelection = ({ 
  availableTimes, 
  selectedTime, 
  onTimeSelect, 
  isLoading = false,
  onRefresh,
  autoRefreshInterval = 5000 // 5 segundos por padrão
}: TimeSelectionProps) => {

  // Auto-refresh para manter horários sincronizados
  useEffect(() => {
    if (!onRefresh || isLoading) return;

    const interval = setInterval(() => {
      onRefresh();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [onRefresh, isLoading, autoRefreshInterval]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Label className="text-black public-text font-medium">Horários Disponíveis</Label>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#19c662] dynamic-border-primary"></div>
          <span className="ml-2 text-gray-600 public-text-secondary">Carregando horários...</span>
        </div>
      </div>
    );
  }

  if (availableTimes.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-black public-text font-medium">Horários Disponíveis</Label>
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="text-xs neutral-button"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Atualizar
            </Button>
          )}
        </div>
        <div className="text-center py-8 text-gray-500 public-text-secondary">
          <p className="text-sm">Não há horários disponíveis para esta data</p>
          <p className="text-xs mt-1">Tente selecionar outro dia ou serviço</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-black public-text font-medium">Horários Disponíveis</Label>
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-xs neutral-button"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Atualizar
          </Button>
        )}
      </div>
      
      {/* Layout carrossel horizontal com scrollbar melhorada */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-[#19c662]">
        <div className="flex gap-3 min-w-max">
          {availableTimes.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => onTimeSelect(time)}
              className={`
                px-4 py-3 text-sm font-medium rounded-lg border-2 whitespace-nowrap min-w-[80px] transition-all duration-200
                ${selectedTime === time 
                  ? 'bg-[#19c662] dynamic-bg-primary text-white border-[#19c662] dynamic-border-primary shadow-md' 
                  : 'bg-white public-surface text-black public-text border-gray-300 public-border hover:border-[#19c662] hover:dynamic-border-primary hover:bg-gray-50'
                }
              `}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-[#19c662] dynamic-primary text-center mt-2">
        ✅ Apenas horários realmente disponíveis são exibidos
      </div>
    </div>
  );
};

export default TimeSelection;
