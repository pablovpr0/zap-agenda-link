
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppointmentActions from '@/components/appointments/AppointmentActions';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  status: string;
}

interface AppointmentDialogProps {
  selectedDate: Date | null;
  appointments: Appointment[];
  onClose: () => void;
  onWhatsAppClick: (phone: string, clientName: string) => void;
  onRefresh?: () => void;
}

const AppointmentDialog = ({ selectedDate, appointments, onClose, onWhatsAppClick, onRefresh }: AppointmentDialogProps) => {
  return (
    <Dialog open={!!selectedDate} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-3">
        {selectedDate && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">
                Agendamentos - {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{appointment.client_name}</p>
                    <p className="text-sm text-gray-600">{appointment.appointment_time}</p>
                    <p className="text-sm text-gray-500">{appointment.service_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{appointment.status}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs md:text-sm text-gray-600 hidden md:inline">{appointment.client_phone}</span>
                    <div className="flex flex-col gap-1">
                      <AppointmentActions
                        appointmentId={appointment.id}
                        currentDate={appointment.appointment_date}
                        currentTime={appointment.appointment_time}
                        clientPhone={appointment.client_phone}
                        clientName={appointment.client_name}
                        onSuccess={onRefresh}
                      />
                      {appointment.client_phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onWhatsAppClick(appointment.client_phone, appointment.client_name)}
                          className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
