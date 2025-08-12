
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Edit, X, Trash2 } from 'lucide-react';
import { useAppointmentActions } from '@/hooks/useAppointmentActions';
import EditAppointmentDialog from './EditAppointmentDialog';

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
  onRefresh
}: AppointmentActionsProps) => {
  const { deleteAppointment, cancelAppointment, isDeleting, isCancelling } = useAppointmentActions();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleCancel = async () => {
    await cancelAppointment(
      appointment.id,
      appointment.client_phone,
      appointment.client_name,
      onRefresh
    );
  };

  const handleDelete = async () => {
    await deleteAppointment(
      appointment.id,
      appointment.client_phone,
      appointment.client_name,
      onRefresh
    );
  };

  const handleEditSuccess = () => {
    onRefresh();
    setShowEditDialog(false);
  };

  return (
    <>
      <div className="flex gap-1">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onWhatsAppClick(appointment.client_phone, appointment.client_name, appointment.appointment_date, appointment.appointment_time)}
          className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
          title="Enviar lembrete via WhatsApp"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowEditDialog(true)}
          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
          title="Editar agendamento"
        >
          <Edit className="w-4 h-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
          title="Excluir agendamento"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <EditAppointmentDialog
        appointment={appointment}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

export default AppointmentActions;
