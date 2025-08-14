
import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/utils/console';

export const subscribeToBookingUpdates = (
  companyId: string,
  date: string,
  onUpdate: () => void
) => {
  devLog(`📡 Iniciando sincronização em tempo real para ${companyId} em ${date}`);
  
  const subscription = supabase
    .channel(`booking-updates-${companyId}-${date}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'appointments',
      filter: `company_id=eq.${companyId}`
    }, (payload) => {
      devLog('🔄 Mudança detectada nos agendamentos:', payload);
      onUpdate();
    })
    .subscribe();

  return () => {
    devLog('📡 Cancelando sincronização em tempo real');
    subscription.unsubscribe();
  };
};

export const triggerBookingUpdate = (companyId: string, date: string) => {
  devLog(`🔄 Disparando atualização de agendamento para ${companyId} em ${date}`);
  // Implementação básica para disparar eventos de atualização
  window.dispatchEvent(new CustomEvent('bookingUpdate', { 
    detail: { companyId, date } 
  }));
};
