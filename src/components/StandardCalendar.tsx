
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, User, Phone } from 'lucide-react';
import { getCompanyAppointments } from '@/services/appointmentService';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  client_name?: string;
  client_phone?: string;
  services?: { name: string };
  professionals?: { name: string };
  status: string;
}

interface StandardCalendarProps {
  companyId: string;
  onDateSelect?: (date: Date) => void;
  onAppointmentSelect?: (appointment: Appointment) => void;
}

const StandardCalendar: React.FC<StandardCalendarProps> = ({
  companyId,
  onDateSelect,
  onAppointmentSelect
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!companyId) return;

      setLoading(true);
      try {
        const data = await getCompanyAppointments(companyId);
        setAppointments(data);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [companyId]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment =>
      isSameDay(parseISO(appointment.appointment_date), date)
    );
  };

  const getDatesWithAppointments = () => {
    return appointments.map(appointment => parseISO(appointment.appointment_date));
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={ptBR}
            className="w-full"
            modifiers={{
              hasAppointments: getDatesWithAppointments()
            }}
            modifiersStyles={{
              hasAppointments: {
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                borderRadius: '6px'
              }
            }}
          />
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded"></div>
              <span>Datas com agendamentos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments for selected date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Agendamentos - {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando agendamentos...</div>
            </div>
          ) : selectedDateAppointments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum agendamento para esta data</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onAppointmentSelect?.(appointment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{appointment.appointment_time}</span>
                        <Badge variant={getStatusBadgeVariant(appointment.status)}>
                          {getStatusText(appointment.status)}
                        </Badge>
                      </div>
                      
                      {appointment.client_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.client_name}</span>
                        </div>
                      )}
                      
                      {appointment.client_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.client_phone}</span>
                        </div>
                      )}
                      
                      {appointment.services?.name && (
                        <div className="text-sm text-muted-foreground">
                          Serviço: {appointment.services.name}
                        </div>
                      )}
                      
                      {appointment.professionals?.name && (
                        <div className="text-sm text-muted-foreground">
                          Profissional: {appointment.professionals.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StandardCalendar;
