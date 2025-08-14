
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateSelectionProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  generateAvailableDates: () => Promise<Date[]>;
}

const DateSelection = ({ selectedDate, onDateSelect, generateAvailableDates }: DateSelectionProps) => {
  const [availableDates, setAvailableDates] = React.useState<Date[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const loadDates = async () => {
      setLoading(true);
      try {
        const dates = await generateAvailableDates();
        setAvailableDates(dates);
      } catch (error) {
        console.error('Erro ao carregar datas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDates();
  }, [generateAvailableDates]);

  const formatDateForDisplay = (date: Date) => {
    return format(date, "dd/MM (EEE)", { locale: ptBR });
  };

  const formatDateForValue = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableDates.map((date) => {
          const dateValue = formatDateForValue(date);
          const isSelected = selectedDate === dateValue;
          
          return (
            <Button
              key={dateValue}
              variant={isSelected ? "default" : "outline"}
              onClick={() => onDateSelect(dateValue)}
              className="p-3 h-auto flex flex-col items-center gap-1"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {formatDateForDisplay(date)}
              </span>
            </Button>
          );
        })}
      </div>
      
      {availableDates.length === 0 && (
        <div className="text-center p-4 text-gray-500">
          Nenhuma data disponível para agendamento
        </div>
      )}
    </div>
  );
};

export default DateSelection;
