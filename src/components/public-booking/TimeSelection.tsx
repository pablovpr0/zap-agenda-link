
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSelectionProps {
  availableTimes: string[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  disabled?: boolean;
}

const TimeSelection: React.FC<TimeSelectionProps> = ({
  availableTimes,
  selectedTime,
  onTimeSelect,
  isLoading = false,
  onRefresh,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Selecione o Horário
        </h3>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando horários disponíveis...</span>
          </div>
        </div>
      ) : availableTimes.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhum horário disponível para esta data e serviço.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente selecionar uma data ou serviço diferente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {availableTimes.map((time) => (
            <Button
              key={time}
              variant={selectedTime === time ? "default" : "outline"}
              className={cn(
                "h-10 text-sm font-medium transition-all duration-200",
                selectedTime === time && "ring-2 ring-primary ring-offset-2",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !disabled && onTimeSelect(time)}
              disabled={disabled}
            >
              {time}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimeSelection;
