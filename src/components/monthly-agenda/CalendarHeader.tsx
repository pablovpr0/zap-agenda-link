
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </h1>
        <Button variant="outline" size="sm" onClick={onToday}>
          <Calendar className="h-4 w-4 mr-2" />
          Hoje
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
