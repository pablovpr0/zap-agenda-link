import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from '@/utils/console';

/**
 * Função de debug para verificar por que horários ocupados ainda aparecem
 */
export const debugBookingAvailability = async (
  companyId: string,
  selectedDate: string
) => {
  devLog('🔍 [DEBUG] Iniciando debug de disponibilidade de horários');
  devLog('📅 [DEBUG] Empresa:', companyId, 'Data:', selectedDate);

  try {
    // 1. Verificar agendamentos existentes
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate);

    if (appointmentsError) {
      devError('❌ [DEBUG] Erro ao buscar agendamentos:', appointmentsError);
      return;
    }

    devLog('📋 [DEBUG] Agendamentos encontrados:', appointments?.length || 0);
    
    if (appointments && appointments.length > 0) {
      appointments.forEach((apt, index) => {
        devLog(`📝 [DEBUG] Agendamento ${index + 1}:`, {
          id: apt.id,
          time: apt.appointment_time,
          status: apt.status,
          client_id: apt.client_id,
          service_id: apt.service_id,
          created_at: apt.created_at
        });
      });
    }

    // 2. Verificar agendamentos apenas com status que bloqueiam horários
    const { data: blockingAppointments, error: blockingError } = await supabase
      .from('appointments')
      .select('appointment_time, duration, status, services(duration)')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .in('status', ['confirmed', 'completed', 'in_progress']);

    if (blockingError) {
      devError('❌ [DEBUG] Erro ao buscar agendamentos bloqueadores:', blockingError);
      return;
    }

    devLog('🚫 [DEBUG] Agendamentos que bloqueiam horários:', blockingAppointments?.length || 0);
    
    if (blockingAppointments && blockingAppointments.length > 0) {
      blockingAppointments.forEach((apt, index) => {
        devLog(`🚫 [DEBUG] Bloqueador ${index + 1}:`, {
          time: apt.appointment_time,
          status: apt.status,
          duration: apt.duration,
          service_duration: apt.services?.duration
        });
      });
    }

    // 3. Verificar configuração do dia
    const date = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = date.getDay();

    const { data: dailySchedule, error: scheduleError } = await supabase
      .from('daily_schedules')
      .select('*')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek);

    if (scheduleError) {
      devError('❌ [DEBUG] Erro ao buscar configuração do dia:', scheduleError);
      return;
    }

    devLog('⚙️ [DEBUG] Configuração do dia da semana:', dayOfWeek, dailySchedule);

    // 4. Verificar cache atual
    const cacheKey = `${companyId}-${selectedDate}-60`;
    devLog('💾 [DEBUG] Chave do cache:', cacheKey);

    return {
      totalAppointments: appointments?.length || 0,
      blockingAppointments: blockingAppointments?.length || 0,
      dailyScheduleActive: dailySchedule?.[0]?.is_active || false,
      appointments: appointments || [],
      blockingAppointments: blockingAppointments || []
    };

  } catch (error) {
    devError('❌ [DEBUG] Erro geral no debug:', error);
  }
};