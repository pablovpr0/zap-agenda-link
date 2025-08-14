import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from '@/utils/console';

/**
 * Verifica se um horário específico está realmente disponível antes do agendamento
 * Esta é a verificação final que deve ser feita no momento do agendamento
 */
export const checkTimeSlotConflict = async (
  companyId: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<{ hasConflict: boolean; conflictDetails?: any }> => {
  
  devLog(`🔍 [CONFLITO] Verificando conflito para ${appointmentDate} às ${appointmentTime}`);

  try {
    // Buscar agendamentos existentes para o mesmo horário
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('id, appointment_time, status, client_id, created_at')
      .eq('company_id', companyId)
      .eq('appointment_date', appointmentDate)
      .neq('status', 'cancelled');

    if (error) {
      devError('❌ [CONFLITO] Erro ao buscar agendamentos:', error);
      return { hasConflict: false }; // Em caso de erro, permitir agendamento
    }

    devLog(`📋 [CONFLITO] Encontrados ${existingAppointments?.length || 0} agendamentos para a data`);

    if (!existingAppointments || existingAppointments.length === 0) {
      devLog(`✅ [CONFLITO] Nenhum agendamento existente - horário livre`);
      return { hasConflict: false };
    }

    // Verificar se algum agendamento conflita com o horário solicitado
    const requestedTime = appointmentTime.length === 5 ? appointmentTime : appointmentTime.substring(0, 5);
    
    for (const apt of existingAppointments) {
      const existingTime = apt.appointment_time.substring(0, 5);
      
      if (existingTime === requestedTime) {
        devLog(`🚨 [CONFLITO] CONFLITO DETECTADO!`);
        devLog(`🚨 [CONFLITO] Horário solicitado: ${requestedTime}`);
        devLog(`🚨 [CONFLITO] Agendamento existente: ${existingTime} (ID: ${apt.id}, Status: ${apt.status})`);
        
        return {
          hasConflict: true,
          conflictDetails: {
            existingAppointmentId: apt.id,
            existingTime: existingTime,
            existingStatus: apt.status,
            existingClientId: apt.client_id,
            createdAt: apt.created_at
          }
        };
      }
    }

    devLog(`✅ [CONFLITO] Nenhum conflito detectado - horário livre`);
    return { hasConflict: false };

  } catch (error) {
    devError('❌ [CONFLITO] Erro na verificação:', error);
    return { hasConflict: false }; // Em caso de erro, permitir agendamento
  }
};

/**
 * Função para ser chamada imediatamente antes de criar um agendamento
 */
export const validateAppointmentSlot = async (
  companyId: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<{ isValid: boolean; message?: string }> => {
  
  const conflictCheck = await checkTimeSlotConflict(companyId, appointmentDate, appointmentTime);
  
  if (conflictCheck.hasConflict) {
    return {
      isValid: false,
      message: `Este horário não está mais disponível. Outro cliente acabou de agendar para ${appointmentTime}.`
    };
  }

  return { isValid: true };
};