
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import NewAppointmentModal from './NewAppointmentModal';
import DashboardStats from './dashboard/DashboardStats';
import PublicBookingLink from './dashboard/PublicBookingLink';
import QuickActions from './dashboard/QuickActions';
import RecentAppointments from './dashboard/RecentAppointments';

type ViewType = 'dashboard' | 'agenda' | 'settings' | 'clients' | 'services';

interface DashboardStats {
  todayAppointments: number;
  totalClients: number;
  monthlyRevenue: number;
  completionRate: number;
}

interface RecentAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  status: string;
}

interface CompanySettings {
  slug: string;
}

interface MerchantDashboardProps {
  companyName: string;
  onViewChange: (view: ViewType) => void;
}

const MerchantDashboard = ({ companyName, onViewChange }: MerchantDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    completionRate: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Buscar configurações da empresa
      const { data: settings } = await supabase
        .from('company_settings')
        .select('slug')
        .eq('company_id', user!.id)
        .single();

      if (settings) {
        setCompanySettings(settings);
      }

      // Buscar estatísticas dos agendamentos
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAppointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', user!.id)
        .eq('appointment_date', today);

      // Buscar total de clientes
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', user!.id);

      // Buscar agendamentos recentes
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          clients!inner(name, phone),
          services!inner(name)
        `)
        .eq('company_id', user!.id)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
        .limit(5);

      // Processar dados dos agendamentos
      const processedAppointments = appointments?.map(apt => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        client_name: apt.clients.name,
        client_phone: apt.clients.phone,
        service_name: apt.services.name,
        status: apt.status
      })) || [];

      setStats({
        todayAppointments: todayAppointments?.length || 0,
        totalClients: clients?.length || 0,
        monthlyRevenue: 0, // TODO: Calcular receita mensal
        completionRate: 85 // TODO: Calcular taxa de conclusão real
      });

      setRecentAppointments(processedAppointments);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPublicBookingLink = () => {
    if (!companySettings?.slug) return '';
    return `${window.location.origin}/public/${companySettings.slug}`;
  };

  const copyBookingLink = async () => {
    const link = getPublicBookingLink();
    if (link) {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link de agendamento foi copiado para a área de transferência.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const shareOnWhatsApp = () => {
    const link = getPublicBookingLink();
    if (link) {
      const message = `Olá! Agende seu horário comigo através do link: ${link}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleNewAppointment = () => {
    setShowNewAppointmentModal(true);
  };

  const handleViewPublicPage = () => {
    const link = getPublicBookingLink();
    if (link) {
      window.location.href = link;
    }
  };

  const handleManageClients = () => {
    onViewChange('clients');
  };

  if (loading) {
    return (
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-whatsapp-muted text-sm">Visão geral do seu negócio</p>
        </div>
      </div>

      {/* Link de Agendamento Público */}
      <PublicBookingLink
        bookingLink={getPublicBookingLink()}
        linkCopied={linkCopied}
        onViewPublicPage={handleViewPublicPage}
        onCopyLink={copyBookingLink}
        onShareWhatsApp={shareOnWhatsApp}
      />

      {/* Cards de Estatísticas */}
      <DashboardStats stats={stats} />

      {/* Ações Rápidas */}
      <QuickActions
        onNewAppointment={handleNewAppointment}
        onViewPublicPage={handleViewPublicPage}
        onManageClients={handleManageClients}
      />

      {/* Agendamentos Recentes */}
      <RecentAppointments appointments={recentAppointments} />

      {/* Modal de Novo Agendamento */}
      <NewAppointmentModal
        open={showNewAppointmentModal}
        onClose={() => setShowNewAppointmentModal(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};

export default MerchantDashboard;
