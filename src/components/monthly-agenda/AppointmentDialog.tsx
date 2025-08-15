
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
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 [&>button]:hidden">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="flex items-center justify-between text-base sm:text-lg md:text-xl">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="text-sm sm:text-base">
                Agendamentos de {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 sm:h-8 sm:w-8 p-0">
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
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
