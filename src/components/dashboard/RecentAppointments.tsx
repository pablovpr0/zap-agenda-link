
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  client_name: string;
  client_phone: string;
  service_name: string;
}

interface RecentAppointmentsProps {
  appointments: RecentAppointment[];
}

const RecentAppointments = ({ appointments }: RecentAppointmentsProps) => {
  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Agendamentos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Nenhum agendamento recente
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600';
      case 'completed':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Agendamentos Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div 
              key={appointment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{appointment.client_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{appointment.client_phone}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {format(new Date(appointment.appointment_date), 'dd/MM', { locale: ptBR })} às {appointment.appointment_time.substring(0, 5)}
                </div>
                <div className={`text-xs ${getStatusColor(appointment.status)}`}>
                  {getStatusLabel(appointment.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentAppointments;
