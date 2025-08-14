import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Phone, User, CheckCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointmentActions } from '@/hooks/useAppointmentActions';
import { useToast } from '@/hooks/use-toast';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

interface RecentAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  status: string;
}

interface RecentAppointmentsListProps {
  appointments: RecentAppointment[];
  loading?: boolean;
  onRefresh?: () => void;
}

const RecentAppointmentsList = ({
  appointments,
  loading,
  onRefresh
}: RecentAppointmentsListProps) => {
  const { completeAppointment, isUpdating } = useAppointmentActions();
  const { toast } = useToast();

  const handleCompleteAppointment = async (appointmentId: string, clientName: string) => {
    try {
      await completeAppointment(appointmentId, clientName, () => {
        if (onRefresh) {
          onRefresh();
        }
        window.dispatchEvent(new CustomEvent('appointmentCompleted'));
      });
    } catch (error) {
      devError('Erro ao marcar como concluído:', error);
    }
  };

  const handleWhatsAppClick = (phone: string, clientName: string, appointmentDate: string, appointmentTime: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedDate = format(new Date(appointmentDate + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR });
    
    const message = `Olá, ${clientName}! 👋\n\n` +
      `🔔 *LEMBRETE DO SEU AGENDAMENTO*\n\n` +
      `📅 *Data:* ${formattedDate}\n` +
      `⏰ *Horário:* ${appointmentTime.substring(0, 5)}\n\n` +
      `Estamos esperando por você! ✨\n\n` +
      `Se precisar de alguma coisa, estamos à disposição! 😊`;

    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Agendamentos Recentes
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Agendamentos Recentes ({appointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4 min-w-0 flex-1 text-sm">
                <span className="font-medium text-gray-800 truncate">
                  {appointment.client_name}
                </span>
                <span className="text-gray-600 truncate">
                  {appointment.client_phone}
                </span>
                <span className="text-gray-600 flex-shrink-0">
                  {format(new Date(appointment.appointment_date + 'T12:00:00'), 'dd/MM')}
                </span>
                <span className="text-gray-600 flex-shrink-0">
                  {appointment.appointment_time.substring(0, 5)}
                </span>
              </div>
              
              {appointment.status === 'completed' && (
                <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded flex-shrink-0">
                  <CheckCircle className="w-3 h-3" />
                  <span>Concluído</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentAppointmentsList;