
import { supabase } from '@/integrations/supabase/client';
import { getNowInBrazil } from '@/utils/timezone';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

export const checkMonthlyLimit = async (
  companyId: string,
  clientPhone: string,
  monthlyAppointmentsLimit?: number,
  isAdminCompany?: boolean
) => {
  // Se a empresa é administrada por um admin, não aplicar limitações
  if (isAdminCompany) {
    devLog('👑 Empresa administrada por admin - ignorando limite mensal');
    return true;
  }

  if (!monthlyAppointmentsLimit) {
    devLog('📊 Limite mensal não configurado, permitindo agendamento');
    return true;
  }

  try {
    const currentDate = getNowInBrazil();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const startOfNextMonth = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    
    devLog(`📊 Verificando limite mensal para cliente ${clientPhone}`);
    devLog(`📅 Período: ${startOfMonth} até ${startOfNextMonth}`);
    devLog(`📊 Limite configurado: ${monthlyAppointmentsLimit}`);
    
    // Buscar cliente por telefone
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('phone', clientPhone)
      .eq('company_id', companyId)
      .maybeSingle();
    
    if (clientError) {
      devError('❌ Erro ao buscar cliente:', clientError);
      return true; // Em caso de erro, permitir agendamento
    }
    
    if (!client) {
      devLog('👤 Cliente novo, permitindo agendamento');
      return true; // Novo cliente, pode agendar
    }

    // Buscar agendamentos do mês atual
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('company_id', companyId)
      .eq('client_id', client.id)
      .gte('appointment_date', startOfMonth)
      .lt('appointment_date', startOfNextMonth)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      devError('❌ Erro ao buscar agendamentos:', appointmentsError);
      return true; // Em caso de erro, permitir agendamento
    }

    const appointmentCount = appointments?.length || 0;
    devLog(`📊 Cliente ${clientPhone} tem ${appointmentCount} agendamentos confirmados este mês`);
    
    const canBook = appointmentCount < monthlyAppointmentsLimit;
    devLog(`✅ Pode agendar: ${canBook}`);
    
    return canBook;
  } catch (error) {
    devError('❌ Erro ao verificar limite mensal:', error);
    return true; // Em caso de erro, permitir agendamento
  }
};

export const checkIfCompanyIsAdmin = async (companyId: string): Promise<boolean> => {
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