import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/utils/console';

/**
 * Função para se inscrever em atualizações de agendamentos em tempo real
 * Monitora mudanças na tabela appointments para uma empresa específica
 */
export const subscribeToBookingUpdates = (
  companyId: string,
  selectedDate: string,
  onUpdate: () => void
) => {
  devLog(`📡 [REALTIME] Iniciando sincronização para empresa ${companyId} na data ${selectedDate}`);

  // Configurar subscription para mudanças na tabela appointments
  const subscription = supabase
    .channel(`appointments-${companyId}-${selectedDate}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Escutar INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'appointments',
        filter: `company_id=eq.${companyId}`,
      },
      (payload) => {
        devLog(`🔄 [REALTIME] Mudança detectada:`, payload);
        
        // Verificar se a mudança afeta a data selecionada
        const appointmentDate = payload.new?.appointment_date || payload.old?.appointment_date;
        
        if (appointmentDate === selectedDate) {
          devLog(`✅ [REALTIME] Mudança relevante para ${selectedDate} - atualizando horários`);
          onUpdate();
        } else {
          devLog(`ℹ️ [REALTIME] Mudança em data diferente (${appointmentDate}) - ignorando`);
        }
      }
    )
    .subscribe((status) => {
      devLog(`📡 [REALTIME] Status da subscription:`, status);
    });

  // Retornar função para cancelar a subscription
  return () => {
    devLog(`📡 [REALTIME] Cancelando subscription para ${companyId}-${selectedDate}`);
    subscription.unsubscribe();
  };
};

/**
 * Função para notificar sobre criação de agendamento
 * Útil para disparar eventos customizados
 */
export const notifyAppointmentCreated = (appointmentData: {
  companyId: string;
  date: string;
  time: string;
}) => {
  // Disparar evento customizado para outros componentes
  const event = new CustomEvent('appointment_created', {
    detail: appointmentData
  });
  
  window.dispatchEvent(event);
  devLog(`📢 [REALTIME] Evento appointment_created disparado:`, appointmentData);
};

/**
 * Função para escutar eventos de agendamento
 */
export const listenToAppointmentEvents = (
  eventType: string,
  callback: (data: any) => void
) => {
  const handler = (event: CustomEvent) => {
    callback(event.detail);
  };

  window.addEventListener(eventType, handler as EventListener);

  // Retornar função para remover o listener
  return () => {
    window.removeEventListener(eventType, handler as EventListener);
  };
};