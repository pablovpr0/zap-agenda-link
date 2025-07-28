
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { DashboardData } from '@/types/dashboard';
import { getStorageData, MockCompanySettings, MockAppointment, MockClient, MockService, STORAGE_KEYS } from '@/data/mockData';

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
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Carregando dados do dashboard para usuário:', user.id);
      
      // Buscar configurações da empresa
      const settings = getStorageData<MockCompanySettings>(STORAGE_KEYS.COMPANY_SETTINGS, null);
      const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const clients = getStorageData<MockClient[]>(STORAGE_KEYS.CLIENTS, []);
      const services = getStorageData(STORAGE_KEYS.SERVICES, []);

      if (!settings) {
        console.error('Configurações da empresa não encontradas');
        return;
      }

      // Gerar URL de agendamento
      const bookingLink = `${window.location.origin}/booking/${settings.company_slug}`;
      console.log('URL de agendamento gerada:', bookingLink);

      // Filtrar dados da empresa
      const companyClients = clients.filter(c => c.company_id === user.id);
      const companyAppointments = appointments.filter(a => a.company_id === user.id);

      // Agendamentos de hoje
      const today = new Date().toISOString().slice(0, 10);
      const todayAppointmentsList = companyAppointments
        .filter(apt => apt.appointment_date === today && apt.status !== 'cancelled')
        .map(apt => {
          const client = companyClients.find(c => c.id === apt.client_id);
          const service = services.find(s => s.id === apt.service_id);
          return {
            id: apt.id,
            appointment_time: apt.appointment_time,
            client_name: client?.name || 'Cliente não encontrado',
            client_phone: client?.phone || '',
            service_name: service?.name || 'Serviço não encontrado',
            status: apt.status
          };
        });

      // Agendamentos recentes
      const recentAppointments = companyAppointments
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(apt => {
          const client = companyClients.find(c => c.id === apt.client_id);
          const service = services.find(s => s.id === apt.service_id);
          return {
            id: apt.id,
            appointment_date: apt.appointment_date,
            appointment_time: apt.appointment_time,
            client_name: client?.name || 'Cliente não encontrado',
            client_phone: client?.phone || '',
            service_name: service?.name || 'Serviço não encontrado',
            status: apt.status
          };
        });

      setData({
        todayAppointments: todayAppointmentsList.length,
        totalClients: companyClients.length,
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
