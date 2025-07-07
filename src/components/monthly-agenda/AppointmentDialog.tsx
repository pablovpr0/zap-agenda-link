
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Phone, MessageCircle, Calendar, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useAppointmentActions } from '@/hooks/useAppointmentActions';

interface Appointment {
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
  appointments: Appointment[];
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

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    if (newStatus === 'cancelled') {
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        await cancelAppointment(appointmentId, appointment.client_phone, appointment.client_name, onRefresh);
      }
    }
  };

  const handleDelete = async (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      await deleteAppointment(appointmentId, appointment.client_phone, appointment.client_name, () => {
        onRefresh();
        if (appointments.length === 1) {
          onClose();
        }
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      case 'no_show':
        return 'Não compareceu';
      default:
        return status;
    }
  };

  if (!selectedDate) return null;

  const sortedAppointments = appointments.sort((a, b) => 
    a.appointment_time.localeCompare(b.appointment_time)
  );

  return (
    <Dialog open={!!selectedDate} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Agendamentos - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {sortedAppointments.map((appointment) => (
            <div key={appointment.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Clock className="w-4 h-4 text-primary" />
                      {appointment.appointment_time.substring(0, 5)}
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusLabel(appointment.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{appointment.client_name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{appointment.client_phone}</span>
                  </div>

                  <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                    <strong>Serviço:</strong> {appointment.service_name} ({appointment.duration}min)
                  </div>

                  {appointment.notes && (
                    <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded">
                      <strong>Observações:</strong> {appointment.notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onWhatsAppClick(
                    appointment.client_phone, 
                    appointment.client_name,
                    appointment.appointment_date,
                    appointment.appointment_time
                  )}
                  className="flex items-center gap-1"
                >
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp
                </Button>

                {appointment.status === 'confirmed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-3 h-3" />
                    Cancelar
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(appointment.id)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
