import React from 'react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import AppointmentCard from './AppointmentCard';

interface CalendarGridProps {
  currentDate: Date;
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  client_name?: string;
  client_phone?: string;
  service_name?: string;
}

interface MonthlyAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  client_name?: string;
  client_phone: string;
  service_name?: string;
  duration: number;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  appointments,
  onDateClick,
  onAppointmentClick
}) => {
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const daysInMonth = [];
  let day = firstDayOfMonth;

  while (day <= lastDayOfMonth) {
    daysInMonth.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const paddingDays = firstDayOfMonth.getDay();
  const totalDays = daysInMonth.length + paddingDays;

  const days = [];
  for (let i = 0; i < totalDays; i++) {
    if (i < paddingDays) {
      days.push(null);
    } else {
      days.push(daysInMonth[i - paddingDays]);
    }
  }

  const mapAppointmentToMonthly = (appointment: Appointment): MonthlyAppointment => {
    return {
      id: appointment.id,
      appointment_date: appointment.appointment_date || new Date().toISOString().split('T')[0],
      appointment_time: appointment.appointment_time,
      status: appointment.status,
      client_name: appointment.client_name,
      client_phone: appointment.client_phone || '',
      service_name: appointment.service_name,
      duration: 30 // Default duration if not provided
    };
  };

  return (
    <div className="grid grid-cols-7 gap-1 mb-6">
      {/* Day headers */}
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
        <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted/50">
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {days.map((day, index) => {
        const dayAppointments = appointments.filter(apt => 
          new Date(apt.appointment_date).toDateString() === day.toDateString()
        );

        return (
          <div
            key={index}
            className={cn(
              "min-h-[120px] p-1 border border-border cursor-pointer hover:bg-accent/50 transition-colors",
              day.getMonth() !== currentDate.getMonth() && "text-muted-foreground bg-muted/20",
              isToday(day) && "bg-primary/10 border-primary/30"
            )}
            onClick={() => onDateClick(day)}
          >
            <div className="text-sm font-medium p-1">
              {day.getDate()}
            </div>
            <div className="space-y-1">
              {dayAppointments.slice(0, 3).map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={mapAppointmentToMonthly(appointment)}
                  onClick={() => onAppointmentClick(appointment)}
                />
              ))}
              {dayAppointments.length > 3 && (
                <div className="text-xs text-muted-foreground p-1">
                  +{dayAppointments.length - 3} mais
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarGrid;
