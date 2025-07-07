
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, MessageSquare, Edit, Trash2, X } from 'lucide-react';
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
  onRefresh: () => void;
}

const AppointmentDialog = ({ 
  selectedDate, 
  appointments, 
  onClose, 
  onWhatsAppClick, 
  onRefresh 
}: AppointmentDialogProps) => {
  const { deleteAppointment, cancelAppointment } = useAppointmentActions();

  if (!selectedDate) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    await cancelAppointment(appointmentId, clientPhone, clientName, onRefresh);
  };

  const handleDeleteAppointment = async (appointmentId: string, clientPhone: string, clientName: string) => {
    await deleteAppointment(appointmentId, clientPhone, clientName, onRefresh);
  };

  return (
    <Dialog open={!!selectedDate} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Agendamentos de {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {appointments.map((appointment, index) => (
            <div key={appointment.id}>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium">
                      {appointment.appointment_time.substring(0, 5)}
                    </span>
                    <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </Badge>
                  </div>
                  
                  {/* Botões de ação responsivos */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Edit className="w-3 h-3" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    
                    {appointment.status !== 'cancelled' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelAppointment(appointment.id, appointment.client_phone, appointment.client_name)}
                        className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
                      >
                        <X className="w-3 h-3" />
                        <span className="hidden sm:inline">Cancelar</span>
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAppointment(appointment.id, appointment.client_phone, appointment.client_name)}
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Excluir</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onWhatsAppClick(appointment.client_phone, appointment.client_name, appointment.appointment_date, appointment.appointment_time)}
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{appointment.client_name}</p>
                      <p className="text-gray-500 text-xs">{appointment.client_phone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700">Serviço</p>
                    <p className="text-gray-600">{appointment.service_name}</p>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Observações:</p>
                    <p className="text-sm text-gray-600">{appointment.notes}</p>
                  </div>
                )}
              </div>
              
              {index < appointments.length - 1 && (
                <Separator className="my-3" />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
