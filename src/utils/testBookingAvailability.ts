import { supabase } from '@/integrations/supabase/client';
import { getSimpleAvailableTimes } from '@/services/simpleBookingService';
import { devLog } from '@/utils/console';

/**
 * Função de teste para verificar se horários ocupados estão sendo filtrados corretamente
 */
export const testBookingAvailability = async () => {
  const companyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee'; // ID da empresa de teste
  const testDate = '2025-08-19'; // Data com agendamentos conhecidos
  
  devLog('🧪 [TESTE] Iniciando teste de disponibilidade de horários');
  devLog('🧪 [TESTE] Empresa:', companyId);
  devLog('🧪 [TESTE] Data:', testDate);
  
  try {
    // 1. Verificar agendamentos existentes no banco
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_time, status, duration')
      .eq('company_id', companyId)
      .eq('appointment_date', testDate)
      .neq('status', 'cancelled');
    
    devLog('🧪 [TESTE] Agendamentos no banco:', appointments);
    
    // 2. Buscar horários disponíveis usando versão simples
    const availableTimes = await getSimpleAvailableTimes(companyId, testDate);
    
    devLog('🧪 [TESTE] Horários disponíveis retornados:', availableTimes);
    
    // 3. Verificar se há conflitos
    const conflicts = [];
    if (appointments) {
      for (const apt of appointments) {
        const aptTime = apt.appointment_time.substring(0, 5); // Normalizar
        if (availableTimes.includes(aptTime)) {
          conflicts.push({
            time: aptTime,
            status: apt.status,
            duration: apt.duration
          });
        }
      }
    }
    
    if (conflicts.length > 0) {
      devLog('🚨 [TESTE] CONFLITOS ENCONTRADOS:', conflicts);
      return {
        success: false,
        conflicts,
        availableTimes,
        appointments
      };
    } else {
      devLog('✅ [TESTE] Nenhum conflito encontrado - sistema funcionando corretamente');
      return {
        success: true,
        conflicts: [],
        availableTimes,
        appointments
      };
    }
    
  } catch (error) {
    devLog('❌ [TESTE] Erro durante o teste:', error);
    return {
      success: false,
      error: error.message,
      conflicts: [],
      availableTimes: [],
      appointments: []
    };
  }
};

// Função para executar o teste automaticamente no console
if (typeof window !== 'undefined') {
  (window as any).testBookingAvailability = testBookingAvailability;
}