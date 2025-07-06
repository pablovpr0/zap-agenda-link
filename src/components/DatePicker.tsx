
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DatePickerProps {
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

const DatePicker = ({ onDateSelect, selectedDate }: DatePickerProps) => {
  const [currentWeek, setCurrentWeek] = useState(0);
  
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(addDays(today, currentWeek * 7), { weekStartsOn: 0 });
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    return addDays(startOfCurrentWeek, i);
  });

  const handleDateClick = (date: Date) => {
    if (isBefore(date, today) && !isSameDay(date, today)) {
      return; // Não permite selecionar datas passadas
    }
    
    const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
    onDateSelect(formattedDate);
  };

  const goToPreviousWeek = () => {
    if (currentWeek > 0) {
      setCurrentWeek(currentWeek - 1);
    }
  };

  const goToNextWeek = () => {
    setCurrentWeek(currentWeek + 1);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousWeek}
          disabled={currentWeek === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <h3 className="font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          {format(startOfCurrentWeek, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextWeek}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {weekDays.map((date, index) => {
          const isPast = isBefore(date, today) && !isSameDay(date, today);
          const isSelected = selectedDate === format(date, 'dd/MM/yyyy', { locale: ptBR });
          const isTodayDate = isToday(date);
          
          return (
            <Card
              key={index}
              className={`
                p-2 cursor-pointer transition-all hover:shadow-md text-center
                ${isPast ? 'opacity-40 cursor-not-allowed' : ''}
                ${isSelected ? 'bg-primary text-white' : ''}
                ${isTodayDate && !isSelected ? 'border-primary border-2' : ''}
              `}
              onClick={() => handleDateClick(date)}
            >
              <div className="text-sm font-medium">
                {format(date, 'd')}
              </div>
              {isTodayDate && (
                <div className="text-xs text-primary">Hoje</div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DatePicker;
