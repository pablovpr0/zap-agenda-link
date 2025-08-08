
import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AppointmentCard from './AppointmentCard';

interface Appointment {
  id: string;
  appointment_time: string;
  client_name?: string;
  service_name?: string;
  professional_name?: string;
  status: string;
}

interface CalendarGridProps {
  currentDate: Date;
  appointments: Record<string, Appointment[]>;
  onAppointmentClick: (appointment: Appointment & { date: string }) => void;
  onDateClick: (date: string) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  appointments,
  onAppointmentClick,
  onDateClick
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Get the first day of the week for the month
  const firstDayOfWeek = monthStart.getDay();
  const daysFromPreviousMonth = Array.from({ length: firstDayOfWeek }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - firstDayOfWeek + i);
    return date;
  });

  // Get remaining days to fill the last week
  const totalCells = Math.ceil((days.length + firstDayOfWeek) / 7) * 7;
  const daysFromNextMonth = Array.from({ length: totalCells - days.length - firstDayOfWeek }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const allDays = [...daysFromPreviousMonth, ...days, ...daysFromNextMonth];

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Week days header */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {allDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointments[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={index}
              className={cn(
                "min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-muted/20 transition-colors",
                !isCurrentMonth && "bg-muted/10",
                isCurrentDay && "bg-primary/5"
              )}
              onClick={() => onDateClick(dateKey)}
            >
              <div className="h-full flex flex-col">
                <div className={cn(
                  "text-sm mb-2",
                  !isCurrentMonth && "text-muted-foreground",
                  isCurrentDay && "font-bold text-primary"
                )}>
                  {format(day, 'd', { locale: ptBR })}
                </div>
                
                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onClick={() => onAppointmentClick({ ...appointment, date: dateKey })}
                    />
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{dayAppointments.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
