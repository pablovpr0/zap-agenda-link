
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAppointmentActions = () => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const deleteAppointment = async (appointmentId: string, clientPhone: string, clientName: string, onSuccess?: () => void) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao excluir agendamento:', error);
        throw new Error('Erro ao excluir agendamento');
      }

      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Erro ao excluir agendamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelAppointment = async (appointmentId: string, clientPhone: string, clientName: string, onSuccess?: () => void) => {
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao cancelar agendamento:', error);
        throw new Error('Erro ao cancelar agendamento');
      }

      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cancelar o agendamento.",
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

      const { error } = await supabase
        .from('appointments')
        .update({ 
          appointment_date: formattedDate, 
          appointment_time: newTime 
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao atualizar agendamento:', error);
        throw new Error('Erro ao atualizar agendamento');
      }

      toast({
        title: "Agendamento atualizado",
        description: "Data e horário alterados com sucesso.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Erro ao atualizar agendamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o agendamento.",
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
