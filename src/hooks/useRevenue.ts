import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { calculateDailyRevenue, calculateMonthlyRevenue, DailyRevenue } from '@/services/revenueService';
import { useToast } from '@/hooks/use-toast';

export const useRevenue = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any>(null);

  const loadDailyRevenue = async (date?: string) => {
    if (!user) return;

    const targetDate = date || new Date().toISOString().split('T')[0];
    setLoading(true);

    try {
      const revenue = await calculateDailyRevenue(user.id, targetDate);
      setDailyRevenue(revenue);
    } catch (error: any) {
      console.error('Erro ao carregar receita diária:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a receita do dia.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyRevenue = async (year?: number, month?: number) => {
    if (!user) return;

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || (now.getMonth() + 1);
    
    setLoading(true);

    try {
      const revenue = await calculateMonthlyRevenue(user.id, targetYear, targetMonth);
      setMonthlyRevenue(revenue);
    } catch (error: any) {
      console.error('Erro ao carregar receita mensal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a receita do mês.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar receita do dia atual automaticamente
  useEffect(() => {
    if (user) {
      loadDailyRevenue();
    }
  }, [user]);

  // Escutar eventos de agendamento concluído para atualizar receita automaticamente
  useEffect(() => {
    const handleAppointmentCompleted = () => {
      console.log('Agendamento concluído detectado, atualizando receita...');
      if (user) {
        loadDailyRevenue();
        // Também recarregar receita mensal se já foi carregada
        if (monthlyRevenue) {
          loadMonthlyRevenue();
        }
      }
    };

    window.addEventListener('appointmentCompleted', handleAppointmentCompleted);
    
    return () => {
      window.removeEventListener('appointmentCompleted', handleAppointmentCompleted);
    };
  }, [user, monthlyRevenue]);

  return {
    loading,
    dailyRevenue,
    monthlyRevenue,
    loadDailyRevenue,
    loadMonthlyRevenue,
    refreshRevenue: () => loadDailyRevenue()
  };
};