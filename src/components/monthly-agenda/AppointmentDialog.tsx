
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Calendar } from 'lucide-react';
import AppointmentCard from './AppointmentCard';

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
  if (!selectedDate) return null;

  return (
    <Dialog open={!!selectedDate} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-md max-h-[80vh] p-3 sm:p-4 [&>button]:hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between text-sm sm:text-base">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="truncate">
                {format(selectedDate, "dd/MM", { locale: ptBR })}
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="w-3 h-3" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {appointments.map((appointment, index) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              index={index}
              totalAppointments={appointments.length}
              onWhatsAppClick={onWhatsAppClick}
              onCancelClick={onCancelClick}
              onRescheduleClick={onRescheduleClick}
              onDeleteClick={onDeleteClick}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
