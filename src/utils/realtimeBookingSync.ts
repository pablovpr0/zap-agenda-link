
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from '@/utils/console';

// Channel para sincronização em tempo real de agendamentos
let bookingChannel: any = null;

export const initializeBookingSync = (companyId: string, onBookingUpdate: () => void) => {
  if (bookingChannel) {
    supabase.removeChannel(bookingChannel);
  }

  devLog('🔄 Inicializando sincronização em tempo real de agendamentos para empresa:', companyId);

  bookingChannel = supabase
    .channel(`booking-updates-${companyId}`)
    .on('broadcast', { event: 'booking-update' }, (payload: any) => {
      devLog('📡 Recebido evento de atualização de agendamento:', payload);
      onBookingUpdate();
    })
    .subscribe();

  return bookingChannel;
};

export const triggerBookingUpdate = (companyId: string, appointmentDate?: string) => {
  if (!bookingChannel) {
    devError('❌ Canal de sincronização não inicializado');
    return;
  }

  const payload = {
    company_id: companyId,
    appointment_date: appointmentDate || new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  };

  devLog('📤 Enviando evento de atualização de agendamento:', payload);

  bookingChannel.send({
    type: 'broadcast',
    event: 'booking-update',
    payload
  });
};

export const cleanupBookingSync = () => {
  if (bookingChannel) {
    supabase.removeChannel(bookingChannel);
    bookingChannel = null;
    devLog('🧹 Limpeza da sincronização de agendamentos concluída');
  }
};
