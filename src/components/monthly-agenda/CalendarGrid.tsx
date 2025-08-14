
import { format, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  status: string;
}

interface CalendarGridProps {
  currentDate: Date;
  calendarDays: Date[];
  getAppointmentsForDate: (date: Date) => Appointment[];
  onDateClick: (date: Date) => void;
}

const CalendarGrid = ({ currentDate, calendarDays, getAppointmentsForDate, onDateClick }: CalendarGridProps) => {
  return (
    <>
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="p-1 md:p-2 text-center text-xs md:text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const dayAppointments = getAppointmentsForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const hasAppointments = dayAppointments.length > 0;
          
          return (
            <div
              key={index}
              className={`
                p-1 md:p-2 min-h-[40px] md:min-h-[60px] border rounded-lg cursor-pointer transition-colors text-center
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                ${isTodayDate ? 'border-primary border-2 bg-primary/5' : 'border-gray-200'}
                ${hasAppointments && isCurrentMonth ? 'hover:bg-blue-50' : 'hover:bg-gray-100'}
              `}
              onClick={() => isCurrentMonth && onDateClick(date)}
            >
              <div className="text-xs md:text-sm font-medium">
                {format(date, 'd')}
              </div>
              {hasAppointments && isCurrentMonth && (
                <div className="mt-1">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full mx-auto"></div>
                  <div className="text-[10px] md:text-xs text-primary mt-1">
                    {dayAppointments.length}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default CalendarGrid;
