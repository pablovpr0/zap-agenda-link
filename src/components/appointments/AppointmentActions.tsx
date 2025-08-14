
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, X } from 'lucide-react';
import { useState } from 'react';
import { useAppointmentActions } from '@/hooks/useAppointmentActions';
import { format } from 'date-fns';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

interface AppointmentActionsProps {
  appointmentId: string;
  currentDate: string;
  currentTime: string;
  clientPhone: string;
  clientName: string;
  onSuccess?: () => void;
}

const AppointmentActions = ({ 
  appointmentId, 
  currentDate, 
  currentTime, 
  clientPhone, 
  clientName, 
  onSuccess 
}: AppointmentActionsProps) => {
  const { deleteAppointment, cancelAppointment, updateAppointment, isDeleting, isCancelling, isUpdating } = useAppointmentActions();
  
  // Converter a data para o formato correto para o input date
  const formatDateForInput = (dateStr: string) => {
    if (dateStr.includes('-')) {
      return dateStr; // Já está no formato YYYY-MM-DD
    }
    // Se estiver em DD/MM/YYYY, converter para YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  };

  const [newDate, setNewDate] = useState(formatDateForInput(currentDate));
  const [newTime, setNewTime] = useState(currentTime);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleUpdate = async () => {
    devLog('Atualizando agendamento:', { appointmentId, newDate, newTime, clientPhone, clientName });
    await updateAppointment(appointmentId, newDate, newTime, clientPhone, clientName, () => {
      setIsEditOpen(false);
      if (onSuccess) onSuccess();
    });
  };

  const handleDelete = async () => {
    await deleteAppointment(appointmentId, clientPhone, clientName, onSuccess);
  };

  const handleCancel = async () => {
    await cancelAppointment(appointmentId, clientPhone, clientName, onSuccess);
  };

  return (
    <div className="flex gap-1">
      {/* Botão Editar */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Edit className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time">Horário</Label>
              <Input
                id="edit-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Botão Cancelar */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
            <X className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? O cliente será notificado via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? 'Cancelando...' : 'Sim, cancelar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Botão Excluir */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita e o cliente será notificado via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppointmentActions;
