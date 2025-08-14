import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from '@/utils/console';

/**
 * Verifica se o cliente pode fazer um novo agendamento baseado no limite simultâneo
 * Este limite é diferente do limite mensal - controla quantos agendamentos ativos o cliente pode ter
 */
export const checkSimultaneousBookingLimit = async (
  companyId: string,
  clientPhone: string,
  isAdminCompany?: boolean
): Promise<{ canBook: boolean; currentCount: number; limit: number; message?: string }> => {
  
  // Se a empresa é administrada por um admin, não aplicar limitações
  if (isAdminCompany) {
    devLog('👑 Empresa administrada por admin - ignorando limite simultâneo');
    return { canBook: true, currentCount: 0, limit: 0 };
  }

  try {
    // Buscar configurações da empresa
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('max_simultaneous_appointments')
      .eq('company_id', companyId)
      .single();

    if (settingsError) {
      devError('❌ Erro ao buscar configurações:', settingsError);
      return { canBook: true, currentCount: 0, limit: 0 }; // Em caso de erro, permitir agendamento
    }

    const simultaneousLimit = settings?.max_simultaneous_appointments || 3; // Padrão: 3
    devLog(`📊 Limite simultâneo configurado: ${simultaneousLimit}`);

    // Buscar cliente por telefone
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('phone', clientPhone)
      .eq('company_id', companyId)
      .single();

    if (clientError || !client) {
      devLog('👤 Cliente novo, permitindo agendamento');
      return { canBook: true, currentCount: 0, limit: simultaneousLimit };
    }

    // Buscar agendamentos ativos (confirmados, em progresso, ou futuros não cancelados)
    const { data: activeAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, status')
      .eq('company_id', companyId)
      .eq('client_id', client.id)
      .in('status', ['confirmed', 'in_progress'])
      .gte('appointment_date', new Date().toISOString().split('T')[0]); // Apenas agendamentos futuros ou de hoje

    if (appointmentsError) {
      devError('❌ Erro ao buscar agendamentos ativos:', appointmentsError);
      return { canBook: true, currentCount: 0, limit: simultaneousLimit }; // Em caso de erro, permitir agendamento
    }

    const currentActiveCount = activeAppointments?.length || 0;
    devLog(`📊 Cliente ${clientPhone} tem ${currentActiveCount} agendamentos ativos. Limite: ${simultaneousLimit}`);

    const canBook = currentActiveCount < simultaneousLimit;
    
    let message;
    if (!canBook) {
      message = `Você já possui ${currentActiveCount} agendamento(s) ativo(s). O limite máximo é ${simultaneousLimit} agendamento(s) simultâneo(s).`;
    }

    return {
      canBook,
      currentCount: currentActiveCount,
      limit: simultaneousLimit,
      message
    };

  } catch (error) {
    devError('❌ Erro ao verificar limite simultâneo:', error);
    return { canBook: true, currentCount: 0, limit: 0 }; // Em caso de erro, permitir agendamento
  }
};

/**
 * Verifica se uma empresa é administrada por um admin
 */
export const checkIfCompanyIsAdminForSimultaneous = async (companyId: string): Promise<boolean> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', companyId)
      .single();

    if (error) {
      devError('❌ Erro ao verificar se empresa é admin:', error);
      return false;
    }

    return profile?.is_admin || false;
  } catch (error) {
    devError('❌ Erro ao verificar se empresa é admin:', error);
    return false;
  }
};