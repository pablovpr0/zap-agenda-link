
import { useState } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PublicCalendarProps {
  availableDates: Date[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const PublicCalendar = ({ availableDates, selectedDate, onDateSelect }: PublicCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => 
      isSameDay(availableDate, date)
    );
  };

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date)) {
      onDateSelect(format(date, 'yyyy-MM-dd'));
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(prev => addDays(startOfMonth(prev), -1));
    } else {
      setCurrentMonth(prev => addDays(endOfMonth(prev), 1));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-green-200 p-4">
      {/* Header do calendário */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-green-50"
        >
          <ChevronLeft className="w-4 h-4 text-green-600" />
        </Button>
        
        <h3 className="text-lg font-semibold text-green-800">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-green-50"
        >
          <ChevronRight className="w-4 h-4 text-green-600" />
        </Button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
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
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={!isAvailable}
              className={`
                aspect-square p-2 text-sm rounded-lg transition-all duration-200
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isAvailable 
                  ? 'hover:bg-green-100 cursor-pointer text-green-800 font-medium border border-green-200' 
                  : 'text-gray-400 cursor-not-allowed'
                }
                ${isSelected ? 'bg-green-500 text-white hover:bg-green-600' : ''}
              `}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PublicCalendar;
