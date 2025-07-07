
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

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
  onWhatsAppClick
}: AppointmentActionsProps) => {
  return (
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
    </div>
  );
};

export default AppointmentActions;
