
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const CalendarHeader = ({ currentDate, onPreviousMonth, onNextMonth }: CalendarHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Agenda Mensal</h2>
        <p className="text-gray-600 text-sm">Gerencie seus agendamentos do mês</p>
      </div>
      
      <div className="flex items-center justify-center md:justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onPreviousMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center min-w-[120px] md:min-w-[140px]">
          <p className="font-medium text-gray-800 text-sm md:text-base">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR, timeZone: 'America/Sao_Paulo' })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
