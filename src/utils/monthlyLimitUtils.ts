
import { supabase } from '@/integrations/supabase/client';

export const checkMonthlyLimit = async (
  companyId: string,
  clientPhone: string,
  monthlyAppointmentsLimit?: number
) => {
  if (!monthlyAppointmentsLimit) {
    console.log('Limite mensal não configurado, permitindo agendamento');
    return true;
  }

  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const startOfNextMonth = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    
    console.log(`Verificando limite mensal para cliente ${clientPhone}`);
    console.log(`Período: ${startOfMonth} até ${startOfNextMonth}`);
    console.log(`Limite configurado: ${monthlyAppointmentsLimit}`);
    
    const { data: monthlyAppointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        status,
        clients!inner(phone)
      `)
      .eq('company_id', companyId)
      .eq('clients.phone', clientPhone)
      .gte('appointment_date', startOfMonth)
      .lt('appointment_date', startOfNextMonth)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Erro ao verificar limite mensal:', error);
      return true;
    }

    const appointmentCount = monthlyAppointments?.length || 0;
    console.log(`Cliente ${clientPhone} tem ${appointmentCount} agendamentos confirmados este mês`);
    
    const canBook = appointmentCount < monthlyAppointmentsLimit;
    console.log(`Pode agendar: ${canBook}`);
    
    return canBook;
  } catch (error) {
    console.error('Erro ao verificar limite mensal:', error);
    return true;
  }
};
