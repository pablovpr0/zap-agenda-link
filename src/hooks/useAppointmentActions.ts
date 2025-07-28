
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStorageData, setStorageData, MockAppointment, STORAGE_KEYS } from '@/data/mockData';

export const useAppointmentActions = () => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const deleteAppointment = async (appointmentId: string, clientPhone: string, clientName: string, onSuccess?: () => void) => {
    setIsDeleting(true);
    try {
      const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const updatedAppointments = appointments.filter(apt => apt.id !== appointmentId);
      setStorageData(STORAGE_KEYS.APPOINTMENTS, updatedAppointments);

      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Erro ao excluir agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelAppointment = async (appointmentId: string, clientPhone: string, clientName: string, onSuccess?: () => void) => {
    setIsCancelling(true);
    try {
      const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const updatedAppointments = appointments.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' as const }
          : apt
      );
      setStorageData(STORAGE_KEYS.APPOINTMENTS, updatedAppointments);

      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const updateAppointment = async (
    appointmentId: string, 
    newDate: string, 
    newTime: string,
    clientPhone: string,
    clientName: string,
    onSuccess?: () => void
  ) => {
    setIsUpdating(true);
    try {
      // Garantir que a data está no formato correto (YYYY-MM-DD)
      const formattedDate = newDate.includes('/') 
        ? newDate.split('/').reverse().join('-') 
        : newDate;

      const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const updatedAppointments = appointments.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, appointment_date: formattedDate, appointment_time: newTime }
          : apt
      );
      setStorageData(STORAGE_KEYS.APPOINTMENTS, updatedAppointments);

      toast({
        title: "Agendamento atualizado",
        description: "Data e horário alterados com sucesso.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Erro ao atualizar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    deleteAppointment,
    cancelAppointment,
    updateAppointment,
    isDeleting,
    isCancelling,
    isUpdating
  };
};
