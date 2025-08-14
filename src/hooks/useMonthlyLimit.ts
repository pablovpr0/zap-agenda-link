
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

export const useMonthlyLimit = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);

  const checkMonthlyLimit = async (clientPhone: string): Promise<boolean> => {
    if (!user) return false;

    setChecking(true);
    try {
      // Verificar se o usuário é admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      // Se o usuário é admin, não aplicar limitações
      if (profileData?.is_admin) {
        devLog('👑 Usuário admin - ignorando limite mensal');
        return true;
      }
      // Buscar configurações da empresa
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('monthly_appointments_limit')
        .eq('company_id', user.id)
        .maybeSingle();

      if (settingsError) {
        devError('Erro ao buscar configurações:', settingsError);
        return true; // Em caso de erro, permite o agendamento
      }

      if (!settings?.monthly_appointments_limit) {
        devLog('Limite mensal não configurado');
        return true; // Se não há limite configurado, permite o agendamento
      }

      const monthlyLimit = settings.monthly_appointments_limit;
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Buscar cliente
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', clientPhone)
        .eq('company_id', user.id)
        .maybeSingle();

      if (clientError) {
        devError('Erro ao buscar cliente:', clientError);
        return true; // Em caso de erro, permite o agendamento
      }

      if (!client) return true; // Se cliente não existe, permite o agendamento

      // Buscar agendamentos do mês atual para este cliente
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id')
        .eq('company_id', user.id)
        .eq('client_id', client.id)
        .gte('appointment_date', `${currentMonth}-01`)
        .lt('appointment_date', `${currentMonth}-32`)
        .neq('status', 'cancelled');

      if (appointmentsError) {
        devError('Erro ao buscar agendamentos:', appointmentsError);
        return true; // Em caso de erro, permite o agendamento
      }

      const appointmentCount = appointments?.length || 0;
      devLog(`Cliente ${clientPhone} tem ${appointmentCount} agendamentos este mês. Limite: ${monthlyLimit}`);

      if (appointmentCount >= monthlyLimit) {
        toast({
          title: "Limite de agendamentos atingido",
          description: `Este cliente já atingiu o limite de ${monthlyLimit} agendamentos por mês.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      devError('Erro ao verificar limite mensal:', error);
      return true; // Em caso de erro, permite o agendamento
    } finally {
      setChecking(false);
    }
  };

  return {
    checkMonthlyLimit,
    checking
  };
};
