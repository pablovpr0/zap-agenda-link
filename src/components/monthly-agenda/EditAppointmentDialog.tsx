
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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

interface EditAppointmentDialogProps {
  appointment: MonthlyAppointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAppointmentDialog = ({ appointment, isOpen, onClose, onSuccess }: EditAppointmentDialogProps) => {
  const { updateAppointment, isUpdating } = useAppointmentActions();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');

  // Inicializar com dados do agendamento quando o modal abrir
  useState(() => {
    if (appointment && isOpen) {
      setSelectedDate(parseISO(appointment.appointment_date));
      setSelectedTime(appointment.appointment_time.substring(0, 5));
    }
  });

  const handleSubmit = async () => {
    if (!appointment || !selectedDate || !selectedTime) return;

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    await updateAppointment(
      appointment.id,
      formattedDate,
      selectedTime,
      appointment.client_phone,
      appointment.client_name,
      () => {
        onSuccess();
        onClose();
      }
    );
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Editar Agendamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <div className="p-2 bg-gray-50 rounded text-sm">
              {appointment.client_name}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Serviço</Label>
            <div className="p-2 bg-gray-50 rounded text-sm">
              {appointment.service_name}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nova Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Novo Horário</Label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecione um horário</option>
              {generateTimeSlots().map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedDate || !selectedTime || isUpdating}
            className="bg-primary hover:bg-primary/90"
          >
            {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentDialog;
