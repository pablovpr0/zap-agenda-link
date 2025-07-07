
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardData {
  todayAppointments: number;
  totalClients: number;
  monthlyRevenue: number;
  completionRate: number;
  bookingLink: string;
  recentAppointments: any[];
}

export const useDashboardData = (companyName: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [data, setData] = useState<DashboardData>({
    todayAppointments: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    completionRate: 0,
    bookingLink: '',
    recentAppointments: []
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
      
      // Buscar configurações da empresa para obter o slug
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('slug')
        .eq('company_id', user.id)
        .single();

      if (settingsError) {
        console.error('Erro ao buscar configurações:', settingsError);
        // Se não encontrar configurações, tentar criar uma padrão
        await createDefaultSettings();
        return;
      }

      const bookingLink = `${window.location.origin}/public/${settings.slug}`;

      // Buscar dados do dashboard
      const today = new Date().toISOString().split('T')[0];
      
      // Agendamentos de hoje
      const { data: todayAppts, error: todayError } = await supabase
        .from('appointments')
        .select('id')
        .eq('company_id', user.id)
        .eq('appointment_date', today)
        .neq('status', 'cancelled');

      if (todayError) {
        console.error('Erro ao buscar agendamentos de hoje:', todayError);
        throw todayError;
      }

      console.log('Agendamentos de hoje encontrados:', todayAppts?.length || 0);

      // Total de clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', user.id);

      if (clientsError) {
        console.error('Erro ao buscar clientes:', clientsError);
        throw clientsError;
      }

      console.log('Total de clientes encontrados:', clientsData?.length || 0);

      // Agendamentos recentes - usando sintaxe correta do Supabase
      const { data: recentAppts, error: recentError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          clients(name, phone),
          services(name)
        `)
        .eq('company_id', user.id)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
        .limit(5);

      if (recentError) {
        console.error('Erro ao buscar agendamentos recentes:', recentError);
        // Tentar consulta alternativa em caso de erro
        const { data: fallbackAppts, error: fallbackError } = await supabase
          .from('appointments')
          .select('*')
          .eq('company_id', user.id)
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false })
          .limit(5);

        if (fallbackError) {
          console.error('Erro na consulta de fallback:', fallbackError);
          throw fallbackError;
        }

        console.log('Usando consulta de fallback, encontrados:', fallbackAppts?.length || 0);
        
        // Para a consulta de fallback, precisamos buscar os dados dos clientes e serviços separadamente
        const transformedFallbackAppts = await Promise.all(
          (fallbackAppts || []).map(async (apt) => {
            const [clientResult, serviceResult] = await Promise.all([
              supabase.from('clients').select('name, phone').eq('id', apt.client_id).single(),
              supabase.from('services').select('name').eq('id', apt.service_id).single()
            ]);

            return {
              id: apt.id,
              appointment_date: apt.appointment_date,
              appointment_time: apt.appointment_time,
              status: apt.status,
              client_name: clientResult.data?.name || 'Cliente não encontrado',
              client_phone: clientResult.data?.phone || '',
              service_name: serviceResult.data?.name || 'Serviço não encontrado'
            };
          })
        );

        setData({
          todayAppointments: todayAppts?.length || 0,
          totalClients: clientsData?.length || 0,
          monthlyRevenue: 0,
          completionRate: 85,
          bookingLink,
          recentAppointments: transformedFallbackAppts
        });

        return;
      }

      console.log('Agendamentos recentes encontrados:', recentAppts?.length || 0);

      // Transformar dados dos agendamentos recentes
      const transformedAppointments = recentAppts?.map(apt => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        status: apt.status,
        client_name: apt.clients?.name || 'Cliente não encontrado',
        client_phone: apt.clients?.phone || '',
        service_name: apt.services?.name || 'Serviço não encontrado'
      })) || [];

      console.log('Dados transformados:', transformedAppointments);

      setData({
        todayAppointments: todayAppts?.length || 0,
        totalClients: clientsData?.length || 0,
        monthlyRevenue: 0,
        completionRate: 85,
        bookingLink,
        recentAppointments: transformedAppointments
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

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      console.log('Criando configurações padrão para:', user.id);
      
      const companySlug = companyName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { error } = await supabase
        .from('company_settings')
        .insert({
          company_id: user.id,
          slug: companySlug,
          working_days: [1, 2, 3, 4, 5, 6],
          working_hours_start: '09:00',
          working_hours_end: '18:00',
          appointment_interval: 30,
          max_simultaneous_appointments: 1,
          advance_booking_limit: 30,
          theme_color: '#22c55e'
        });

      if (error) {
        console.error('Erro ao criar configurações:', error);
        return;
      }

      console.log('Configurações criadas com sucesso');
      // Recarregar dados após criar configurações
      await loadDashboardData();

    } catch (error: any) {
      console.error('Erro ao criar configurações padrão:', error);
    }
  };

  return {
    data,
    loading,
    refreshData: loadDashboardData
  };
};
