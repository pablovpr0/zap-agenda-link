
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppointmentActions from '@/components/appointments/AppointmentActions';

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
  onRefresh?: () => void;
}

const RecentAppointments = ({ appointments, onRefresh }: RecentAppointmentsProps) => {
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

  const handleWhatsAppClick = (phone: string, clientName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Olá ${clientName}! Aqui é da ${window.location.hostname}. Como posso ajudá-lo(a)?`;
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
                <div className="flex items-center gap-2">
                  <AppointmentActions
                    appointmentId={appointment.id}
                    currentDate={appointment.appointment_date}
                    currentTime={appointment.appointment_time}
                    clientPhone={appointment.client_phone}
                    clientName={appointment.client_name}
                    onSuccess={onRefresh}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleWhatsAppClick(appointment.client_phone, appointment.client_name)}
                    className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700"
                  >
                    <MessageCircle className="w-4 h-4" />
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
