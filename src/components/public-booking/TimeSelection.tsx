
import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RealTimeSyncIndicator from './RealTimeSyncIndicator';

interface TimeSelectionProps {
  availableTimes: string[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  // Novas props para sincronização
  isConnected?: boolean;
  isSyncing?: boolean;
  lastSync?: Date;
  nextRefresh?: number;
  autoRefreshInterval?: number;
}

const TimeSelection = ({ 
  availableTimes, 
  selectedTime, 
  onTimeSelect, 
  isLoading = false,
  onRefresh,
  isConnected = true,
  isSyncing = false,
  lastSync,
  nextRefresh,
  autoRefreshInterval = 1000 // Reduzido para 1 segundo
}: TimeSelectionProps) => {

  if (isLoading && !isSyncing) {
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

  if (availableTimes.length === 0 && !isLoading && !isSyncing) {
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
              disabled={isSyncing}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          )}
        </div>
        
        <RealTimeSyncIndicator 
          isConnected={isConnected}
          isSyncing={isSyncing}
          lastSync={lastSync}
          nextRefresh={nextRefresh}
          className="justify-center py-2"
        />
        
        <div className="text-center py-8 text-gray-500 public-text-secondary">
          <p className="text-sm">Não há horários disponíveis para esta data</p>
          <p className="text-xs mt-1">Tente selecionar outro dia ou aguarde a sincronização</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-black public-text font-medium">
          Horários Disponíveis
          {isSyncing && (
            <span className="ml-2 text-xs text-blue-600 animate-pulse">
              sincronizando...
            </span>
          )}
        </Label>
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-xs neutral-button"
            disabled={isSyncing}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        )}
      </div>

      {/* Indicador de sincronização */}
      <RealTimeSyncIndicator 
        isConnected={isConnected}
        isSyncing={isSyncing}
        lastSync={lastSync}
        nextRefresh={nextRefresh}
        className="justify-end"
      />
      
      {/* Layout carrossel horizontal com scrollbar melhorada */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-[#19c662]">
        <div className="flex gap-3 min-w-max">
          {availableTimes.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => onTimeSelect(time)}
              disabled={isSyncing}
              className={`
                px-4 py-3 text-sm font-medium rounded-lg border-2 whitespace-nowrap min-w-[80px] transition-all duration-200
                ${selectedTime === time 
                  ? 'bg-[#19c662] dynamic-bg-primary text-white border-[#19c662] dynamic-border-primary shadow-md' 
                  : 'bg-white public-surface text-black public-text border-gray-300 public-border hover:border-[#19c662] hover:dynamic-border-primary hover:bg-gray-50'
                }
                ${isSyncing ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
              `}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-[#19c662] dynamic-primary text-center mt-2">
        ✅ Horários atualizados em tempo real ({availableTimes.length} disponíveis)
      </div>
    </div>
  );
};

export default TimeSelection;
