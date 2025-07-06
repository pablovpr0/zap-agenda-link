
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  status: string;
}

interface RecentAppointmentsProps {
  appointments: RecentAppointment[];
}

const RecentAppointments = ({ appointments }: RecentAppointmentsProps) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
      completed: { label: 'Concluído', color: 'bg-blue-100 text-blue-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="bg-white border-whatsapp">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
          <Clock className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
          Agendamentos Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0">
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-whatsapp-muted">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum agendamento encontrado</p>
            <p className="text-sm">Os agendamentos aparecerão aqui quando forem criados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 border border-whatsapp rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 mb-2 md:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate text-gray-800">{appointment.client_name}</p>
                    {getStatusBadge(appointment.status)}
                  </div>
                  <div className="text-sm text-whatsapp-muted space-y-1">
                    <p>📅 {format(new Date(appointment.appointment_date), 'dd/MM/yyyy', { locale: ptBR })} às {appointment.appointment_time}</p>
                    <p>💇 {appointment.service_name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`tel:${appointment.client_phone}`)}
                    className="border-whatsapp"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentAppointments;
