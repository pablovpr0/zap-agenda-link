
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DashboardStats from './dashboard/DashboardStats';
import PublicBookingLink from './dashboard/PublicBookingLink';
import QuickActions from './dashboard/QuickActions';
import RecentAppointments from './dashboard/RecentAppointments';
import NewAppointmentModal from './NewAppointmentModal';

interface MerchantDashboardProps {
  companyName: string;
  onViewChange: (view: 'dashboard' | 'agenda' | 'settings' | 'clients' | 'services') => void;
}

interface DashboardData {
  todayAppointments: number;
  totalClients: number;
  monthlyRevenue: number;
  completionRate: number;
  bookingLink: string;
  recentAppointments: any[];
}

const MerchantDashboard = ({ companyName, onViewChange }: MerchantDashboardProps) => {
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
  const [linkCopied, setLinkCopied] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

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

      setData({
        todayAppointments: todayAppts?.length || 0,
        totalClients: clientsData?.length || 0,
        monthlyRevenue: 0, // TODO: Implementar cálculo de receita
        completionRate: 85, // TODO: Implementar cálculo real
        bookingLink,
        recentAppointments: recentAppts || []
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

  const handleCopyLink = async () => {
    if (!data.bookingLink) return;

    try {
      await navigator.clipboard.writeText(data.bookingLink);
      setLinkCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleViewPublicPage = () => {
    if (data.bookingLink) {
      window.open(data.bookingLink, '_blank');
    }
  };

  const handleShareWhatsApp = () => {
    if (!data.bookingLink) return;

    const message = `Olá! Você pode agendar seus horários diretamente pelo link: ${data.bookingLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleNewAppointmentSuccess = () => {
    loadDashboardData(); // Recarregar dados após criar agendamento
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto"></div>
          <p className="mt-2 text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Boas-vindas */}
      <div className="bg-white rounded-lg p-4 md:p-6 border border-whatsapp">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
          Olá! Bem-vindo ao seu painel
        </h2>
        <p className="text-whatsapp-muted">
          Gerencie seus agendamentos, clientes e configurações tudo em um só lugar.
        </p>
      </div>

      {/* Estatísticas */}
      <DashboardStats stats={{
        todayAppointments: data.todayAppointments,
        totalClients: data.totalClients,
        monthlyRevenue: data.monthlyRevenue,
        completionRate: data.completionRate
      }} />

      {/* Link de agendamento público */}
      <PublicBookingLink
        bookingLink={data.bookingLink}
        linkCopied={linkCopied}
        onViewPublicPage={handleViewPublicPage}
        onCopyLink={handleCopyLink}
        onShareWhatsApp={handleShareWhatsApp}
      />

      {/* Ações rápidas */}
      <QuickActions
        onNewAppointment={() => setShowNewAppointmentModal(true)}
        onViewPublicPage={handleViewPublicPage}
        onManageClients={() => onViewChange('clients')}
      />

      {/* Agendamentos recentes */}
      <RecentAppointments 
        appointments={data.recentAppointments}
        onViewAll={() => onViewChange('agenda')}
      />

      {/* Modal de novo agendamento */}
      <NewAppointmentModal
        isOpen={showNewAppointmentModal}
        onClose={() => setShowNewAppointmentModal(false)}
        onSuccess={handleNewAppointmentSuccess}
      />
    </div>
  );
};

export default MerchantDashboard;
