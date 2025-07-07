
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Phone, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TodayAppointment {
  id: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  service_name: string;
}

interface TodayAppointmentsListProps {
  appointments: TodayAppointment[];
  loading?: boolean;
}

const TodayAppointmentsList = ({ appointments, loading }: TodayAppointmentsListProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Agendamentos de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Carregando agendamentos...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Agendamentos de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Nenhum agendamento para hoje
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedAppointments = appointments.sort((a, b) => 
    a.appointment_time.localeCompare(b.appointment_time)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Agendamentos de Hoje ({appointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedAppointments.map((appointment) => (
            <div 
              key={appointment.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <Clock className="w-4 h-4" />
                  {appointment.appointment_time.substring(0, 5)}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{appointment.client_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{appointment.client_phone}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                {appointment.service_name}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayAppointmentsList;
