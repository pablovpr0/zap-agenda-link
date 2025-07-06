
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
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
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

      if (todayError) throw todayError;

      // Total de clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', user.id);

      if (clientsError) throw clientsError;

      // Agendamentos recentes
      const { data: recentAppts, error: recentError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          clients!inner(name, phone),
          services!inner(name)
        `)
        .eq('company_id', user.id)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Transformar dados dos agendamentos recentes
      const transformedAppointments = recentAppts?.map(apt => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        status: apt.status,
        client_name: apt.clients.name,
        client_phone: apt.clients.phone,
        service_name: apt.services.name
      })) || [];

      setData({
        todayAppointments: todayAppts?.length || 0,
        totalClients: clientsData?.length || 0,
        monthlyRevenue: 0, // TODO: Implementar cálculo de receita
        completionRate: 85, // TODO: Implementar cálculo real
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
