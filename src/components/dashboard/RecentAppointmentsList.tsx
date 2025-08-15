
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, CheckCircle, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ITEMS_PER_PAGE = 5;

const RecentAppointmentsList = ({
  appointments,
  loading,
  onRefresh
}: RecentAppointmentsListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const {
    completeAppointment,
    isUpdating
  } = useAppointmentActions();
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

  // Ordenar do mais recente para o mais antigo (por data e hora de criação)
  const sortedAppointments = appointments.sort((a, b) => {
    const dateTimeA = new Date(`${a.appointment_date}T${a.appointment_time}`);
    const dateTimeB = new Date(`${b.appointment_date}T${b.appointment_time}`);
    return dateTimeB.getTime() - dateTimeA.getTime();
  });

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
          Agendamentos Recentes ({appointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {currentAppointments.map(appointment => (
            <div key={appointment.id} className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
              {/* Primeira linha: Nome do cliente, Data, Horário e Status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Nome do cliente */}
                  <div className="flex items-center gap-1 min-w-0">
                    <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {appointment.client_name}
                    </span>
                  </div>
                  
                  {/* Data */}
                  <span className="text-sm text-gray-600 flex-shrink-0">
                    {format(new Date(appointment.appointment_date + 'T12:00:00'), 'dd/MM')}
                  </span>

                  {/* Horário */}
                  <div className="flex items-center gap-1 text-sm text-gray-600 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                    <span>{appointment.appointment_time.substring(0, 5)}</span>
                  </div>
                </div>
                
                {/* Status - apenas ícone */}
                {appointment.status === 'completed' && (
                  <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-700" />
                  </div>
                )}
              </div>

              {/* Segunda linha: Serviço */}
              <div className="flex items-center gap-1 text-sm text-gray-700 ml-1">
                <Briefcase className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">{appointment.service_name}</span>
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

export default RecentAppointmentsList;
