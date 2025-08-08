
import React from 'react';
import { format, isSameDay, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyAppointment {
  id: string;
  appointment_time: string;
  appointment_date: string;
  status: string;
  duration: number;
  notes?: string;
  client_name: string;
  client_phone: string;
  service_name: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  client_name: string;
  client_phone: string;
  service_name: string;
}

interface CalendarGridProps {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onDateClick: (date: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  appointments,
  onAppointmentClick,
  onDateClick
}) => {
  // Get the first day of the first week of the month
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  
  // Get the last day of the last week of the month
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Generate all days to display
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const dateKey = appointment.appointment_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Header with day names */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {weekDays.map((day, index) => (
          <div key={index} className="p-2 text-center text-sm font-medium text-gray-600 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7">
        {days.map((day, dayIndex) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={dayIndex}
              className={`min-h-[80px] md:min-h-[100px] p-1 md:p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors
                ${!isCurrentMonth ? 'bg-gray-25 text-gray-400' : ''}
                ${isToday ? 'bg-blue-50' : ''}
              `}
              onClick={() => onDateClick(day)}
            >
              <div className={`text-xs md:text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayAppointments.slice(0, 2).map((appointment) => {
                  // Convert Appointment to MonthlyAppointment format for consistency
                  const monthlyAppointment: MonthlyAppointment = {
                    id: appointment.id,
                    appointment_time: appointment.appointment_time,
                    appointment_date: appointment.appointment_date,
                    status: appointment.status,
                    duration: 60, // Default duration
                    client_name: appointment.client_name,
                    client_phone: appointment.client_phone || '',
                    service_name: appointment.service_name
                  };

                  return (
                    <div
                      key={appointment.id}
                      className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(appointment.status)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appointment);
                      }}
                    >
                      <div className="font-medium truncate">
                        {appointment.appointment_time.substring(0, 5)}
                      </div>
                      <div className="truncate">
                        {appointment.client_name}
                      </div>
                    </div>
                  );
                })}
                
                {dayAppointments.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayAppointments.length - 2} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
