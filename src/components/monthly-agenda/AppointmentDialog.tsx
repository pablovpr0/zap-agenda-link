
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, MessageSquare, Edit, Trash2, X, RotateCcw } from 'lucide-react';
import { useAppointmentActions } from '@/hooks/useAppointmentActions';

interface MonthlyAppointment {
  id: string;
  appointment_time: string;
  appointment_date: string;
  status: string;
  duration: number;
  notes?: string;
  client_name: string;
  client_phone: string;
  service_name: string;
}

interface AppointmentDialogProps {
  selectedDate: Date | null;
  appointments: MonthlyAppointment[];
  onClose: () => void;
  onWhatsAppClick: (phone: string, clientName: string, appointmentDate?: string, appointmentTime?: string) => void;
  onCancelClick: (phone: string, clientName: string) => void;
  onRescheduleClick: (phone: string, clientName: string) => void;
  onDeleteClick: () => void;
  onRefresh: () => void;
}

const AppointmentDialog = ({ 
  selectedDate, 
  appointments, 
  onClose, 
  onWhatsAppClick,
  onCancelClick,
  onRescheduleClick,
  onDeleteClick,
  onRefresh 
}: AppointmentDialogProps) => {
  const { deleteAppointment, cancelAppointment } = useAppointmentActions();

  if (!selectedDate) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const handleCancelAppointment = async (appointmentId: string, clientPhone: string, clientName: string) => {
    try {
      await cancelAppointment(appointmentId, clientPhone, clientName, onRefresh);
      onCancelClick(clientPhone, clientName);
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string, clientPhone: string, clientName: string) => {
    try {
      await deleteAppointment(appointmentId, clientPhone, clientName, onRefresh);
      onDeleteClick();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
    }
  };

  const handleRescheduleAppointment = (clientPhone: string, clientName: string) => {
    onRescheduleClick(clientPhone, clientName);
  };

  return (
    <Dialog open={!!selectedDate} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center justify-between text-lg md:text-xl">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Agendamentos de {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {appointments.map((appointment, index) => (
            <div key={appointment.id}>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 md:p-6 space-y-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                {/* Header do Card */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                      <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold text-gray-800">
                        {appointment.appointment_time.substring(0, 5)}
                      </span>
                    </div>
                    <Badge className={`text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </Badge>
                  </div>
                  
                  {/* Botões de ação responsivos */}
                  <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2 text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800"
                    >
                      <Edit className="w-3 h-3" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRescheduleAppointment(appointment.client_phone, appointment.client_name)}
                      className="flex items-center gap-2 text-xs bg-white hover:bg-yellow-50 border-yellow-200 text-yellow-700 hover:text-yellow-800"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Reagendar</span>
                    </Button>
                    
                    {appointment.status !== 'cancelled' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelAppointment(appointment.id, appointment.client_phone, appointment.client_name)}
                        className="flex items-center gap-2 text-xs bg-white hover:bg-orange-50 border-orange-200 text-orange-600 hover:text-orange-700"
                      >
                        <X className="w-3 h-3" />
                        <span className="hidden sm:inline">Cancelar</span>
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAppointment(appointment.id, appointment.client_phone, appointment.client_name)}
                      className="flex items-center gap-2 text-xs bg-white hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Excluir</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onWhatsAppClick(appointment.client_phone, appointment.client_name, appointment.appointment_date, appointment.appointment_time)}
                      className="flex items-center gap-2 text-xs bg-white hover:bg-green-50 border-green-200 text-green-600 hover:text-green-700"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span className="hidden sm:inline">Lembrete</span>
                    </Button>
                  </div>
                </div>

                {/* Informações do Cliente e Serviço */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-1">{appointment.client_name}</p>
                        <p className="text-sm text-gray-600">{appointment.client_phone}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-primary rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 mb-1">Serviço</p>
                        <p className="text-gray-800 font-medium">{appointment.service_name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {appointment.notes && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Observações:
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">{appointment.notes}</p>
                  </div>
                )}
              </div>
              
              {index < appointments.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
