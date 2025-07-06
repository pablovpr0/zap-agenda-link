
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Plus,
  ExternalLink,
  Phone,
  Copy,
  CheckCircle,
  Share
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NewAppointmentModal from './NewAppointmentModal';

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
  onViewChange: (view: string) => void;
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
      window.open(link, '_blank');
    }
  };

  const handleManageClients = () => {
    onViewChange('clients');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
      completed: { label: 'Concluído', color: 'bg-blue-100 text-blue-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
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
      {companySettings?.slug && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-medium text-green-800 mb-1">Link de Agendamento Público</h3>
                <p className="text-sm text-green-600 break-all">
                  {getPublicBookingLink()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleViewPublicPage}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Visualizar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyBookingLink}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  {linkCopied ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {linkCopied ? 'Copiado!' : 'Copiar'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={shareOnWhatsApp}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Share className="w-4 h-4 mr-1" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-whatsapp-muted">Hoje</p>
                <p className="text-lg md:text-2xl font-bold text-gray-800">{stats.todayAppointments}</p>
              </div>
              <Calendar className="w-6 md:w-8 h-6 md:h-8 text-whatsapp-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-whatsapp-muted">Clientes</p>
                <p className="text-lg md:text-2xl font-bold text-gray-800">{stats.totalClients}</p>
              </div>
              <Users className="w-6 md:w-8 h-6 md:h-8 text-whatsapp-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-whatsapp-muted">Receita</p>
                <p className="text-lg md:text-2xl font-bold text-gray-800">R$ {stats.monthlyRevenue}</p>
              </div>
              <DollarSign className="w-6 md:w-8 h-6 md:h-8 text-whatsapp-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-whatsapp-muted">Taxa</p>
                <p className="text-lg md:text-2xl font-bold text-gray-800">{stats.completionRate}%</p>
              </div>
              <TrendingUp className="w-6 md:w-8 h-6 md:h-8 text-whatsapp-green" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer bg-white border-whatsapp"
          onClick={handleNewAppointment}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="w-5 h-5 text-whatsapp-green" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Novo Agendamento</h3>
                <p className="text-sm text-whatsapp-muted">Criar agendamento manual</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer bg-white border-whatsapp"
          onClick={handleViewPublicPage}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ExternalLink className="w-5 h-5 text-whatsapp-green" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Página do Cliente</h3>
                <p className="text-sm text-whatsapp-muted">Ver página pública</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer bg-white border-whatsapp"
          onClick={handleManageClients}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-whatsapp-green" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Gerenciar Clientes</h3>
                <p className="text-sm text-whatsapp-muted">Ver todos os clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agendamentos Recentes */}
      <Card className="bg-white border-whatsapp">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
            <Clock className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
            Agendamentos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          {recentAppointments.length === 0 ? (
            <div className="text-center py-8 text-whatsapp-muted">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum agendamento encontrado</p>
              <p className="text-sm">Os agendamentos aparecerão aqui quando forem criados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((appointment) => (
                <div key={appointment.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 border border-whatsapp rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0 mb-2 md:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate text-gray-800">{appointment.client_name}</p>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="text-sm text-whatsapp-muted space-y-1">
                      <p>📅 {format(new Date(appointment.appointment_date), 'dd/MM/yyyy', { locale: ptBR })} às {appointment.appointment_time}</p>
                      <p>💇 {appointment.service_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`tel:${appointment.client_phone}`)}
                      className="border-whatsapp"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
