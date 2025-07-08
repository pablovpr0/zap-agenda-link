import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getBrasiliaDate, formatBrazilianDate } from '@/lib/dateConfig';

interface DashboardData {
  todayAppointments: number;
  totalClients: number;
  monthlyRevenue: number;
  completionRate: number;
  bookingLink: string;
  recentAppointments: any[];
  todayAppointmentsList: any[];
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

      const bookingLink = `https://zapagenda.site/${settings.slug}`;

      // Usar horário de Brasília para data de hoje
      const todayBrasilia = getBrasiliaDate();
      const todayStr = formatBrazilianDate(todayBrasilia).split('/').reverse().join('-'); // converter DD/MM/YYYY para YYYY-MM-DD
      
      console.log('Data de hoje (Brasília):', todayBrasilia);
      console.log('Data formatada para busca:', todayStr);
      
      // Agendamentos de hoje com detalhes
      const { data: todayAppts, error: todayError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          status,
          clients(name, phone),
          services(name)
        `)
        .eq('company_id', user.id)
        .eq('appointment_date', todayStr)
        .neq('status', 'cancelled')
        .order('appointment_time');

      if (todayError) {
        console.error('Erro ao buscar agendamentos de hoje:', todayError);
        throw todayError;
      }

      console.log('Agendamentos de hoje encontrados:', todayAppts?.length || 0);
      console.log('Agendamentos de hoje detalhes:', todayAppts);

      // Transformar agendamentos de hoje
      const todayAppointmentsList = todayAppts?.map(apt => ({
        id: apt.id,
        appointment_time: apt.appointment_time,
        status: apt.status,
        client_name: apt.clients?.name || 'Cliente não encontrado',
        client_phone: apt.clients?.phone || '',
        service_name: apt.services?.name || 'Serviço não encontrado'
      })) || [];

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

      // Agendamentos recentes
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
        throw recentError;
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

      setData({
        todayAppointments: todayAppts?.length || 0,
        totalClients: clientsData?.length || 0,
        monthlyRevenue: 0,
        completionRate: 85,
        bookingLink,
        recentAppointments: transformedAppointments,
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
