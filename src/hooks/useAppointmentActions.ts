
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAppointmentActions = () => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const openWhatsAppNotification = (phone: string, clientName: string, action: 'rescheduled' | 'cancelled' | 'deleted', newDate?: string, newTime?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    let message = '';
    
    if (action === 'rescheduled' && newDate && newTime) {
      const formattedDate = new Date(newDate).toLocaleDateString('pt-BR');
      message = `Olá ${clientName}! Seu agendamento foi reagendado para ${formattedDate} às ${newTime}. Qualquer dúvida, entre em contato conosco.`;
    } else if (action === 'cancelled') {
      message = `Olá ${clientName}! Seu agendamento foi cancelado. Entre em contato conosco para reagendar ou se tiver alguma dúvida.`;
    } else if (action === 'deleted') {
      message = `Olá ${clientName}! Seu agendamento foi excluído do sistema. Entre em contato conosco se precisar reagendar.`;
    }
    
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const deleteAppointment = async (appointmentId: string, clientPhone: string, clientName: string, onSuccess?: () => void) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      });

      // Abrir WhatsApp para notificar o cliente
      openWhatsAppNotification(clientPhone, clientName, 'deleted');

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
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso.",
      });

      // Abrir WhatsApp para notificar o cliente
      openWhatsAppNotification(clientPhone, clientName, 'cancelled');

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

      const { error } = await supabase
        .from('appointments')
        .update({ 
          appointment_date: formattedDate,
          appointment_time: newTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Agendamento atualizado",
        description: "Data e horário alterados com sucesso.",
      });

      // Abrir WhatsApp para notificar o cliente
      openWhatsAppNotification(clientPhone, clientName, 'rescheduled', formattedDate, newTime);

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
