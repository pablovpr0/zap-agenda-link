
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardData } from '@/types/dashboard';
import { fetchCompanySettings, createDefaultSettings } from '@/services/companySettingsService';
import { fetchTodayAppointments, fetchRecentAppointments } from '@/services/appointmentsService';
import { fetchTotalClients } from '@/services/clientsService';
import { generatePublicBookingUrl } from '@/lib/domainConfig';

export const useDashboardData = (companyName: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [data, setData] = useState<DashboardData>({
    todayAppointments: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    completionRate: 0,
    bookingLink: '',
    recentAppointments: [],
    todayAppointmentsList: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      
      // Configurar realtime subscription para agendamentos
      const channel = supabase
        .channel('dashboard-appointments')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `company_id=eq.${user.id}`
        }, (payload) => {
          console.log('Agendamento alterado via realtime:', payload);
          loadDashboardData();
        })
        .subscribe();

      return () => {
        console.log('Removendo canal de realtime');
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Carregando dados do dashboard para usuário:', user.id);
      
      // Buscar configurações da empresa
      let settings;
      try {
        settings = await fetchCompanySettings(user.id);
      } catch (error) {
        // Se não encontrar, criar configurações padrão
        await createDefaultSettings(user.id, companyName);
        // Tentar buscar novamente após criar
        settings = await fetchCompanySettings(user.id);
      }

      // Gerar a URL correta usando o domínio personalizado
      const bookingLink = generatePublicBookingUrl(settings.slug);
      console.log('URL de agendamento gerada:', bookingLink);

      // Buscar todos os dados em paralelo
      const [todayAppointmentsList, totalClients, recentAppointments] = await Promise.all([
        fetchTodayAppointments(user.id),
        fetchTotalClients(user.id),
        fetchRecentAppointments(user.id)
      ]);

      setData({
        todayAppointments: todayAppointmentsList.length,
        totalClients,
        monthlyRevenue: 0,
        completionRate: 85,
        bookingLink,
        recentAppointments,
        todayAppointmentsList
      });

    } catch (error: any) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    refreshData: loadDashboardData
  };
};
