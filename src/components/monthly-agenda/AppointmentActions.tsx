
import { Button } from '@/components/ui/button';
import { Edit, Trash2, X, RotateCcw, MessageSquare } from 'lucide-react';
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

interface AppointmentActionsProps {
  appointment: MonthlyAppointment;
  onWhatsAppClick: (phone: string, clientName: string, appointmentDate?: string, appointmentTime?: string) => void;
  onCancelClick: (phone: string, clientName: string) => void;
  onRescheduleClick: (phone: string, clientName: string) => void;
  onDeleteClick: () => void;
  onRefresh: () => void;
}

const AppointmentActions = ({
  appointment,
  onWhatsAppClick,
  onCancelClick,
  onRescheduleClick,
  onDeleteClick,
  onRefresh
}: AppointmentActionsProps) => {
  const { deleteAppointment, cancelAppointment } = useAppointmentActions();

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
  );
};

export default AppointmentActions;
