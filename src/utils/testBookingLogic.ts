import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/utils/console';

/**
 * Função de teste para verificar se horários ocupados estão sendo filtrados corretamente
 */
export const testBookingLogic = async (companyId: string, selectedDate: string) => {
  devLog('🧪 [TESTE] Iniciando teste da lógica de agendamento');
  
  try {
    // 1. Buscar todos os agendamentos da data
    const { data: allAppointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate);

    devLog('📋 [TESTE] Total de agendamentos na data:', allAppointments?.length || 0);

    // 2. Buscar apenas agendamentos não cancelados
    const { data: activeAppointments } = await supabase
      .from('appointments')
      .select('appointment_time, status, duration')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .neq('status', 'cancelled');

    devLog('✅ [TESTE] Agendamentos ativos (não cancelados):', activeAppointments?.length || 0);

    if (activeAppointments && activeAppointments.length > 0) {
      activeAppointments.forEach((apt, i) => {
        devLog(`📝 [TESTE] Agendamento ${i + 1}:`, {
          time: apt.appointment_time,
          status: apt.status,
          duration: apt.duration
        });
      });
    }

    // 3. Simular geração de horários bloqueados
    const blockedTimes = new Set<string>();
    
    if (activeAppointments) {
      for (const apt of activeAppointments) {
        const timeStr = apt.appointment_time.substring(0, 5); // HH:mm
        blockedTimes.add(timeStr);
        devLog(`🚫 [TESTE] Horário bloqueado: ${timeStr}`);
      }
    }

    devLog('🚫 [TESTE] Total de horários bloqueados:', blockedTimes.size);
    devLog('🚫 [TESTE] Lista de horários bloqueados:', Array.from(blockedTimes));

    return {
      totalAppointments: allAppointments?.length || 0,
      activeAppointments: activeAppointments?.length || 0,
      blockedTimes: Array.from(blockedTimes),
      appointments: activeAppointments || []
    };

  } catch (error) {
    devLog('❌ [TESTE] Erro no teste:', error);
    return null;
  }
};