
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const useMonthlyLimit = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);

  const checkMonthlyLimit = async (clientPhone: string): Promise<boolean> => {
    if (!user) return false;

    setChecking(true);
    try {
      // Buscar configurações da empresa
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('monthly_appointments_limit')
        .eq('company_id', user.id)
        .single();

      if (settingsError || !settings?.monthly_appointments_limit) {
        console.log('Limite mensal não configurado ou erro ao buscar configurações');
        return true; // Se não há limite configurado, permite o agendamento
      }

      const monthlyLimit = settings.monthly_appointments_limit;
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Buscar agendamentos do mês atual para este cliente
      const { data: monthlyAppointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          clients!inner(phone)
        `)
        .eq('company_id', user.id)
        .eq('clients.phone', clientPhone)
        .gte('appointment_date', `${currentMonth}-01`)
        .lt('appointment_date', `${currentMonth}-32`)
        .neq('status', 'cancelled');

      if (error) {
        console.error('Erro ao verificar limite mensal:', error);
        return true; // Em caso de erro, permite o agendamento
      }

      const appointmentCount = monthlyAppointments?.length || 0;
      console.log(`Cliente ${clientPhone} tem ${appointmentCount} agendamentos este mês. Limite: ${monthlyLimit}`);

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
      console.error('Erro ao verificar limite mensal:', error);
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
