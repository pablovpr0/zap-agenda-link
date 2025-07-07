
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarDatePickerProps {
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

const CalendarDatePicker = ({ onDateSelect, selectedDate }: CalendarDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const today = new Date();
  const parsedDate = selectedDate ? new Date(selectedDate.split('/').reverse().join('-')) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date && (!isBefore(date, today) || isToday(date))) {
      const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
      onDateSelect(formattedDate);
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-primary" />
        Selecione a Data
      </h3>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? selectedDate : "Selecione uma data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleDateSelect}
            disabled={(date) => isBefore(date, today) && !isToday(date)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CalendarDatePicker;
