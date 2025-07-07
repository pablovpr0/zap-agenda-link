
import { useState } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StandardCalendarProps {
  availableDates?: Date[];
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  showNavigation?: boolean;
  highlightToday?: boolean;
  disabled?: boolean;
}

const StandardCalendar = ({ 
  availableDates = [], 
  selectedDate, 
  onDateSelect,
  showNavigation = true,
  highlightToday = true,
  disabled = false
}: StandardCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Começar no domingo
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const isDateAvailable = (date: Date) => {
    if (availableDates.length === 0) return true; // Se não há restrições, todas as datas são disponíveis
    return availableDates.some(availableDate => 
      isSameDay(availableDate, date)
    );
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const handleDateClick = (date: Date) => {
    if (disabled || !isDateAvailable(date)) return;
    
    if (onDateSelect) {
      onDateSelect(format(date, 'yyyy-MM-dd'));
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(prev => addMonths(prev, -1));
    } else {
      setCurrentMonth(prev => addMonths(prev, 1));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-green-200 p-4">
      {/* Header do calendário */}
      {showNavigation && (
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-green-50"
            disabled={disabled}
          >
            <ChevronLeft className="w-4 h-4 text-green-600" />
          </Button>
          
          <h3 className="text-lg font-semibold text-green-800 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-green-50"
            disabled={disabled}
          >
            <ChevronRight className="w-4 h-4 text-green-600" />
          </Button>
        </div>
      )}

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isAvailable = isDateAvailable(date);
          const isSelected = selectedDate === format(date, 'yyyy-MM-dd');
          const isTodayDate = highlightToday && isToday(date);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={disabled || !isAvailable}
              className={`
                aspect-square p-2 text-sm rounded-lg transition-all duration-200 relative
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isAvailable && isCurrentMonth
                  ? 'hover:bg-green-100 cursor-pointer text-green-800 font-medium border border-green-200' 
                  : 'text-gray-400 cursor-not-allowed'
                }
                ${isSelected ? 'bg-green-500 text-white hover:bg-green-600 border-green-500' : ''}
                ${isTodayDate && !isSelected ? 'bg-green-50 border-green-300 font-bold' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {format(date, 'd')}
              {isTodayDate && !isSelected && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StandardCalendar;
