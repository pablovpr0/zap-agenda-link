import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, CheckCircle, MessageSquare, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointmentActions } from '@/hooks/useAppointmentActions';
import { useToast } from '@/hooks/use-toast';
import { getNowInBrazil } from '@/utils/timezone';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

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

const ITEMS_PER_PAGE = 5;

const TodayAppointmentsList = ({
  appointments,
  loading,
  onRefresh
}: TodayAppointmentsListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const {
    completeAppointment,
    deleteAppointment,
    isUpdating,
    isDeleting
  } = useAppointmentActions();
  const { toast } = useToast();

  const handleCompleteAppointment = async (appointmentId: string, clientName: string) => {
    try {
      await completeAppointment(appointmentId, clientName, () => {
        // Forçar atualização imediata dos dados
        if (onRefresh) {
          onRefresh();
        }
        // Também disparar evento customizado para atualizar receita
        window.dispatchEvent(new CustomEvent('appointmentCompleted'));
      });
    } catch (error) {
      devError('Erro ao marcar como concluído:', error);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string, clientName: string, clientPhone: string) => {
    if (!confirm(`Tem certeza que deseja excluir o agendamento de ${clientName}?`)) return;
    try {
      await deleteAppointment(appointmentId, clientPhone, clientName, () => {
        if (onRefresh) {
          onRefresh();
        }
      });
    } catch (error) {
      devError('Erro ao excluir agendamento:', error);
    }
  };

  const handleWhatsAppClick = (phone: string, clientName: string, appointmentTime: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const today = getNowInBrazil();
    const todayFormatted = format(today, "dd 'de' MMMM", {
      locale: ptBR
    });
    const message = `Olá, ${clientName}! 👋\n\n` + `🔔 *LEMBRETE DO SEU AGENDAMENTO*\n\n` + `📅 *Data:* Hoje, ${todayFormatted}\n` + `⏰ *Horário:* ${appointmentTime.substring(0, 5)}\n\n` + `Estamos esperando por você! ✨\n\n` + `Se precisar de alguma coisa, estamos à disposição! 😊`;
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

  // Ordenar por horário (primeiro para último)
  const sortedAppointments = appointments.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  
  // Calcular paginação
  const totalPages = Math.ceil(sortedAppointments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAppointments = sortedAppointments.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Agendamentos de Hoje ({appointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Layout simplificado em 2 linhas */}
        <div className="space-y-3">
          {currentAppointments.map(appointment => (
            <div key={appointment.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:bg-gray-50 transition-colors">
              {/* Linha 1: Horário, Nome e Telefone + Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Horário */}
                  <div className="flex items-center gap-2 text-green-600 font-bold">
                    <Clock className="w-4 h-4" />
                    <span className="text-lg">{appointment.appointment_time.substring(0, 5)}</span>
                  </div>
                  
                  {/* Nome */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-gray-800 truncate">{appointment.client_name}</span>
                  </div>
                  
                  {/* Telefone */}
                  <div className="text-gray-600 min-w-0">
                    
                  </div>
                </div>
                
                {/* Status */}
                {appointment.status === 'completed' && (
                  <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded ml-2">
                    <CheckCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Concluído</span>
                  </div>
                )}
              </div>
              
              {/* Linha 2: Ações no canto esquerdo */}
              <div className="flex justify-start gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleWhatsAppClick(appointment.client_phone, appointment.client_name, appointment.appointment_time)} 
                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-50" 
                  title="Enviar lembrete via WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>

                {appointment.status !== 'completed' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCompleteAppointment(appointment.id, appointment.client_name)} 
                    disabled={isUpdating} 
                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" 
                    title="Marcar como concluído"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDeleteAppointment(appointment.id, appointment.client_name, appointment.client_phone)} 
                  disabled={isDeleting} 
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" 
                  title="Excluir agendamento"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayAppointmentsList;
