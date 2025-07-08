
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Phone, User, CheckCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointmentActions } from '@/hooks/useAppointmentActions';
import { useToast } from '@/hooks/use-toast';
import { getBrasiliaDate, formatBrazilianDate, formatBrazilianTime } from '@/lib/dateConfig';

interface TodayAppointment {
  id: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  status: string;
}

interface TodayAppointmentsListProps {
  appointments: TodayAppointment[];
  loading?: boolean;
  onRefresh?: () => void;
}

const TodayAppointmentsList = ({ appointments, loading, onRefresh }: TodayAppointmentsListProps) => {
  const { updateAppointment, isUpdating } = useAppointmentActions();
  const { toast } = useToast();

  const handleCompleteAppointment = async (appointmentId: string, clientName: string) => {
    try {
      const currentDate = getBrasiliaDate();
      const currentDateStr = formatBrazilianDate(currentDate).split('/').reverse().join('-'); // converter para YYYY-MM-DD
      const currentTimeStr = formatBrazilianTime(currentDate);
      
      await updateAppointment(
        appointmentId,
        currentDateStr,
        currentTimeStr,
        '', // não precisa do telefone para esta atualização
        clientName,
        () => {
          toast({
            title: "Procedimento concluído",
            description: `Agendamento de ${clientName} marcado como concluído.`,
          });
          if (onRefresh) onRefresh();
        }
      );
      
      // Atualizar status para concluído no banco
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);
        
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error);
    }
  };

  const handleWhatsAppClick = (phone: string, clientName: string, appointmentTime: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const today = getBrasiliaDate();
    const todayFormatted = format(today, "dd 'de' MMMM", { locale: ptBR });
    
    const message = `Olá, ${clientName}! 👋\n\n` +
      `🔔 *LEMBRETE DO SEU AGENDAMENTO*\n\n` +
      `📅 *Data:* Hoje, ${todayFormatted}\n` +
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
              className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <div className="flex items-center gap-2 text-green-600 font-medium flex-shrink-0">
                  <Clock className="w-4 h-4" />
                  {appointment.appointment_time.substring(0, 5)}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="font-medium truncate">{appointment.client_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 min-w-0">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{appointment.client_phone}</span>
                </div>
                <div className="text-sm text-gray-600 bg-white px-2 py-1 rounded flex-shrink-0">
                  <span className="truncate block max-w-32">{appointment.service_name}</span>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWhatsAppClick(appointment.client_phone, appointment.client_name, appointment.appointment_time)}
                  className="flex items-center gap-2 text-xs bg-green-50 hover:bg-green-100 border-green-300 text-green-700 hover:text-green-800"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
                
                {appointment.status !== 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCompleteAppointment(appointment.id, appointment.client_name)}
                    disabled={isUpdating}
                    className="flex items-center gap-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 hover:text-blue-800"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {isUpdating ? 'Concluindo...' : 'Concluído'}
                    </span>
                  </Button>
                )}
                
                {appointment.status === 'completed' && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                    <CheckCircle className="w-3 h-3" />
                    <span>Concluído</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayAppointmentsList;
