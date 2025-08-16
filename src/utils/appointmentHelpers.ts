
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from '@/utils/console';

/**
 * Helper function to count active appointments for a client
 * This avoids complex TypeScript inference issues
 */
export const countClientActiveAppointments = async (
  companyId: string,
  clientPhone: string,
  fromDate: string,
  excludeAppointmentId?: string
): Promise<number> => {
  try {
    // Use a simple query with manual counting
    const query = supabase
      .from('appointments')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('client_phone', clientPhone)
      .gte('appointment_date', fromDate);

    const { data, error } = await query;

    if (error) {
      devError('❌ Erro ao contar agendamentos:', error);
      return 0;
    }

    if (!data) return 0;

    // Manual counting to avoid TypeScript issues
    let count = 0;
    for (const appointment of data) {
      const status = appointment.status || 'confirmed';
      const isActive = status === 'confirmed' || status === 'scheduled';
      const shouldExclude = excludeAppointmentId && appointment.id === excludeAppointmentId;
      
      if (isActive && !shouldExclude) {
        count++;
      }
    }

    return count;

  } catch (error) {
    devError('❌ Erro no helper de contagem:', error);
    return 0;
  }
};
