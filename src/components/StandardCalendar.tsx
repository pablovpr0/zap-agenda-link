
import { useState } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getNowInBrazil, getTodayInBrazil } from '@/utils/timezone';
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
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const isDateAvailable = (date: Date) => {
    if (availableDates.length === 0) return true;
    return availableDates.some(availableDate => 
      isSameDay(availableDate, date)
    );
  };

  const isToday = (date: Date) => {
    return isSameDay(date, getNowInBrazil());
  };

  const handleDateClick = (date: Date) => {
    if (disabled || !isDateAvailable(date)) return;
    
    if (onDateSelect) {
      // Seleção imediata da data
      const dateString = format(date, 'yyyy-MM-dd', { timeZone: 'America/Sao_Paulo' });
      onDateSelect(dateString);
      
      // Log para debug
      console.log('📅 Data selecionada imediatamente:', dateString);
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      {/* Header do calendário */}
      {showNavigation && (
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
            disabled={disabled}
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </Button>
          
          <h3 className="text-lg font-semibold text-black capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
            disabled={disabled}
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
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
          const isSelected = selectedDate === format(date, 'yyyy-MM-dd', { timeZone: 'America/Sao_Paulo' });
          const isTodayDate = highlightToday && isToday(date);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={disabled || !isAvailable}
              className={`
                aspect-square p-2 text-sm rounded-lg transition-all duration-150 relative font-medium
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isAvailable && isCurrentMonth
                  ? 'hover:bg-gray-100 cursor-pointer text-black border border-gray-200 active:scale-95' 
                  : 'text-gray-400 cursor-not-allowed border border-gray-100 bg-gray-50 opacity-60'
                }
                ${isSelected ? 'bg-[#19c662] dynamic-bg-primary text-white hover:bg-[#005c39] hover:dynamic-bg-secondary border-[#19c662] dynamic-border-primary shadow-md transform scale-105' : ''}
                ${isTodayDate && !isSelected ? 'bg-gray-100 border-gray-300 font-bold' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {format(date, 'd')}
              {isTodayDate && !isSelected && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#19c662] rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StandardCalendar;
