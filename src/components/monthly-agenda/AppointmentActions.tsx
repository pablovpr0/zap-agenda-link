
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
      <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onWhatsAppClick(appointment.client_phone, appointment.client_name, appointment.appointment_date, appointment.appointment_time)}
          className="flex items-center gap-2 text-xs bg-green-50 hover:bg-green-100 border-green-300 text-green-700 hover:text-green-800"
        >
          <MessageSquare className="w-3 h-3" />
          <span className="hidden sm:inline">Lembrete</span>
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowEditDialog(true)}
          className="flex items-center gap-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 hover:text-blue-800"
        >
          <Edit className="w-3 h-3" />
          <span className="hidden sm:inline">Editar</span>
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={handleCancel}
          disabled={isCancelling}
          className="flex items-center gap-2 text-xs bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-700 hover:text-orange-800"
        >
          <X className="w-3 h-3" />
          <span className="hidden sm:inline">
            {isCancelling ? 'Cancelando...' : 'Cancelar'}
          </span>
        </Button>

        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 text-xs bg-red-50 hover:bg-red-100 border-red-300 text-red-700 hover:text-red-800"
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden sm:inline">
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </span>
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
